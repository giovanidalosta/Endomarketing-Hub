import pandas as pd
from datetime import datetime
from flask import Flask, render_template, request, send_file, jsonify
import os
import json
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import zipfile
import base64

app = Flask(__name__)
ASSETS_DIR = os.path.join(app.root_path, "assets")
FONTS_DIR = os.path.join(ASSETS_DIR, "fontes")

def load_font(filename, size):
    try:
        return ImageFont.truetype(os.path.join(FONTS_DIR, filename), size)
    except IOError:
        return ImageFont.load_default()

def quebra_texto_bbox(draw, font, text, max_width):
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        current_line.append(word)
        line_w = draw.textbbox((0, 0), " ".join(current_line), font=font)[2]
        if line_w > max_width:
            if len(current_line) == 1:
                lines.append(current_line[0])
                current_line = []
            else:
                current_line.pop()
                lines.append(" ".join(current_line))
                current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
    return lines


def quebrar_texto(draw, texto, largura_max, fonte):
    if not texto: return []
    linhas_finais = []
    
    paragrafos = texto.split('\n')
    for p in paragrafos:
        if not p.strip():
            linhas_finais.append("")
            continue
            
        palavras = p.split(' ')
        linha = ""
        for palavra in palavras:
            if not palavra: continue
            teste = linha + " " + palavra if linha else palavra
            bbox = draw.textbbox((0, 0), teste, font=fonte)
            largura = bbox[2] - bbox[0]
            if largura <= largura_max:
                linha = teste
            else:
                if linha: linhas_finais.append(linha)
                linha = palavra
        if linha:
            linhas_finais.append(linha)
            
    return linhas_finais

def escrever_multilinha(draw, x, y, texto, largura_max, fonte):
    linhas = quebrar_texto(draw, texto, largura_max, fonte)
    for i, linha in enumerate(linhas):
        draw.text((x, y + (i * 50)), linha, fill="white", font=fonte)

@app.route('/api/certificado-config', methods=['GET', 'POST'])
def api_certificado_config():
    modelo = request.args.get('modelo', 'alura')

    # Defaults calibrados pixel-a-pixel no template 1684x1190
    DEFAULTS = {
        'alura': {
            'cert-nome-txt':        {'top': '255px',  'left': '50%',   'transform': 'translateX(-50%)', 'color': '#ffffff', 'fontSize': '95px'},
            'cert-curso-txt':       {'top': '512px',  'left': '350px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '44px'},
            'cert-carga-txt':       {'top': '650px',  'left': '350px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '48px'},
            'cert-data-txt':        {'top': '650px',  'left': '720px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '48px'},
            'cert-tema-txt':        {'top': '512px',  'left': '350px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '44px'},
            'cert-apresentador-txt':{'top': '720px',  'left': '350px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '40px'},
        },
        'ikated': {
            'cert-nome-txt':        {'top': '320px',  'left': '150px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '95px'},
            'cert-curso-txt':       {'top': '512px',  'left': '150px', 'transform': 'none',             'color': '#ffffff', 'fontSize': '42px'},
            'cert-carga-txt':       {'top': '940px',  'left': '50%',   'transform': 'translateX(-50%)', 'color': '#ffffff', 'fontSize': '36px'},
            'cert-data-txt':        {'top': '800px',  'left': '50%',   'transform': 'translateX(-50%)', 'color': '#ffffff', 'fontSize': '36px'},
            'cert-tema-txt':        {'top': '550px',  'left': '50%',   'transform': 'translateX(-50%)', 'color': '#ffffff', 'fontSize': '42px'},
            'cert-apresentador-txt':{'top': '870px',  'left': '50%',   'transform': 'translateX(-50%)', 'color': '#ffffff', 'fontSize': '36px'},
        },
    }

    if request.method == 'POST':
        all_configs = {}
        config_path = os.path.join(app.root_path, 'certificado_config.json')
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                all_configs = json.load(f)
        all_configs[modelo] = request.get_json(force=True)
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(all_configs, f, indent=4, ensure_ascii=False)
        return jsonify(ok=True)

    # GET — return saved config or defaults
    config_path = os.path.join(app.root_path, 'certificado_config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            all_configs = json.load(f)
        if modelo in all_configs:
            return jsonify(all_configs[modelo])

@app.route('/api/upload-certificado-bg', methods=['POST'])
def api_upload_certificado_bg():
    if 'file' not in request.files:
        return jsonify(success=False, error="Nenhum arquivo enviado")
    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, error="Nome de arquivo vazio")
    
    modelo = request.args.get('modelo', 'alura')
    
    static_dir = os.path.join(app.root_path, "static")
    assets_dir = os.path.join(app.root_path, "assets")
    
    filename = f"certificado_base_{modelo}.png"
    static_path = os.path.join(static_dir, filename)
    assets_path = os.path.join(assets_dir, filename)
    
    try:
        img = Image.open(file)
        img.save(static_path, format="PNG")
        img.save(assets_path, format="PNG")
        return jsonify(success=True)
    except Exception as e:
        return jsonify(success=False, error=str(e))
@app.route('/api/preview_certificado', methods=['POST'])
def api_preview_certificado():
    modelo = request.form.get("modelo", "alura")
    nome = request.form.get("nome", "Nome do Aluno").strip() or "Nome do Aluno"
    curso = request.form.get("curso", "Nome do Curso").strip() or "Nome do Curso"
    carga = request.form.get("carga", "Carga Horária").strip() or "Carga Horária"
    data = request.form.get("data", "Data").strip() or "Data"
    tema = request.form.get("tema", "Tema").strip() or "Tema"
    apresentador = request.form.get("apresentador", "Apresentador").strip() or "Apresentador"
    
    base_path = os.path.join(ASSETS_DIR, f"certificado_base_{modelo}.png")
    if not os.path.exists(base_path):
        base_path = os.path.join(ASSETS_DIR, "certificado_base.png")
        
    try:
        img = Image.open(base_path).copy()
    except:
        return jsonify(error="Imagem base não encontrada."), 500

    fonte_path = os.path.join(ASSETS_DIR, "fontes", "Exo-Regular.ttf")
    if not os.path.exists(fonte_path):
        fonte_path = os.path.join(ASSETS_DIR, "Exo-Regular.ttf")
        
    try:
        fonte_nome = ImageFont.truetype(fonte_path, 105)
        fonte_curso = ImageFont.truetype(fonte_path, 42)
        fonte_info = ImageFont.truetype(fonte_path, 50)
        fonte_pequena = ImageFont.truetype(fonte_path, 36)
    except:
        fonte_nome = ImageFont.load_default()
        fonte_curso = ImageFont.load_default()
        fonte_info = ImageFont.load_default()
        fonte_pequena = ImageFont.load_default()

    draw = ImageDraw.Draw(img)
    
    if modelo == 'alura':
        # --- Fonte sizes calibradas ao template 1684x1190 ---
        f_nome  = ImageFont.truetype(fonte_path, 95)
        f_curso = ImageFont.truetype(fonte_path, 44)
        f_info  = ImageFont.truetype(fonte_path, 48)

        # NOME — centralizado na zona útil (x=200..1500, excluindo faixa ciano esquerda)
        bb = draw.textbbox((0, 0), nome, font=f_nome)
        larg = bb[2] - bb[0]
        x_nome = 200 + (1300 - larg) / 2
        draw.text((x_nome, 255), nome, fill='white', font=f_nome)

        # CURSO — abaixo do label "CURSO" já impresso na imagem base
        escrever_multilinha(draw, 350, 512, curso, 950, f_curso)

        # CARGA HORÁRIA — abaixo do label "CARGA HORÁRIA"
        draw.text((350, 650), carga, fill='white', font=f_info)

        # CONCLUSÃO (data) — abaixo do label "CONCLUSÃO"
        draw.text((720, 650), data, fill='white', font=f_info)
    else:
        # CERTIFICADO DE PARTICIPAÇÃO
        draw.text((150, 250), "CERTIFICADO DE PARTICIPAÇÃO", fill="white", font=fonte_pequena)
        
        # Nome
        draw.text((150, 320), nome, fill="white", font=fonte_nome)
        
        # Certificamos que participou...
        texto_tema = f"Certificamos que participou do IKATED: {tema}"
        bbox = draw.textbbox((0, 0), texto_tema, font=fonte_curso)
        largura_texto = bbox[2] - bbox[0]
        x_tema = (img.width - largura_texto) / 2
        draw.text((x_tema, 550), texto_tema, fill="white", font=fonte_curso)
        
        # Concluído no dia
        texto_data = f"Concluído no dia {data}"
        bbox = draw.textbbox((0, 0), texto_data, font=fonte_pequena)
        largura_texto = bbox[2] - bbox[0]
        x_data = (img.width - largura_texto) / 2
        draw.text((x_data, 800), texto_data, fill="white", font=fonte_pequena)
        
        # Ministrado por
        texto_min = f"Ministrado por: {apresentador}"
        bbox = draw.textbbox((0, 0), texto_min, font=fonte_pequena)
        largura_texto = bbox[2] - bbox[0]
        x_min = (img.width - largura_texto) / 2
        draw.text((x_min, 870), texto_min, fill="white", font=fonte_pequena)
        
        # Carga horária
        texto_carga = f"Carga horária: {carga}"
        bbox = draw.textbbox((0, 0), texto_carga, font=fonte_pequena)
        largura_texto = bbox[2] - bbox[0]
        x_carga = (img.width - largura_texto) / 2
        draw.text((x_carga, 940), texto_carga, fill="white", font=fonte_pequena)

    img_io = BytesIO()
    img.save(img_io, format='PNG')
    img_b64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
    
    return jsonify(image="data:image/png;base64," + img_b64)

@app.route('/api/certificados-lote', methods=['POST'])
def api_certificados_lote():
    modelo = request.form.get("modelo", "alura")
    nomes_lote = request.form.get("nomes_lote", "").strip()
    if not nomes_lote:
        return jsonify(error="A lista de nomes está vazia."), 400
        
    base_path = os.path.join(ASSETS_DIR, f"certificado_base_{modelo}.png")
    if not os.path.exists(base_path):
        base_path = os.path.join(ASSETS_DIR, "certificado_base.png")
        
    try:
        base_img = Image.open(base_path)
    except:
        return jsonify(error="Imagem base não encontrada."), 500

    fonte_path = os.path.join(ASSETS_DIR, "fontes", "Exo-Regular.ttf")
    if not os.path.exists(fonte_path):
        fonte_path = os.path.join(ASSETS_DIR, "Exo-Regular.ttf")
        
    try:
        fonte_nome = ImageFont.truetype(fonte_path, 105)
        fonte_curso = ImageFont.truetype(fonte_path, 42)
        fonte_info = ImageFont.truetype(fonte_path, 50)
        fonte_pequena = ImageFont.truetype(fonte_path, 36)
    except:
        fonte_nome = ImageFont.load_default()
        fonte_curso = ImageFont.load_default()
        fonte_info = ImageFont.load_default()
        fonte_pequena = ImageFont.load_default()

    nomes = [n.strip() for n in nomes_lote.split('\n') if n.strip()]
    curso = request.form.get("curso", "").strip()
    carga = request.form.get("carga", "").strip()
    data = request.form.get("data", "").strip()
    tema = request.form.get("tema", "").strip()
    apresentador = request.form.get("apresentador", "").strip()
    
    memory_zip = BytesIO()
    with zipfile.ZipFile(memory_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for nome in nomes:
            img = base_img.copy()
            draw = ImageDraw.Draw(img)
            
            if modelo == 'alura':
                f_nome  = ImageFont.truetype(fonte_path, 95)  if os.path.exists(fonte_path) else ImageFont.load_default()
                f_curso = ImageFont.truetype(fonte_path, 44)  if os.path.exists(fonte_path) else ImageFont.load_default()
                f_info  = ImageFont.truetype(fonte_path, 48)  if os.path.exists(fonte_path) else ImageFont.load_default()

                # NOME centralizado na zona útil
                bb = draw.textbbox((0, 0), nome, font=f_nome)
                larg = bb[2] - bb[0]
                x_nome = 200 + (1300 - larg) / 2
                draw.text((x_nome, 255), nome, fill='white', font=f_nome)

                escrever_multilinha(draw, 350, 512, curso, 950, f_curso)
                draw.text((350, 650), carga, fill='white', font=f_info)
                draw.text((720, 650), data,  fill='white', font=f_info)
            else:
                draw.text((150, 250), "CERTIFICADO DE PARTICIPAÇÃO", fill="white", font=fonte_pequena)
                draw.text((150, 320), nome, fill="white", font=fonte_nome)
                
                texto_tema = f"Certificamos que participou do IKATED: {tema}"
                bbox = draw.textbbox((0, 0), texto_tema, font=fonte_curso)
                largura_texto = bbox[2] - bbox[0]
                x_tema = (img.width - largura_texto) / 2
                draw.text((x_tema, 550), texto_tema, fill="white", font=fonte_curso)
                
                texto_data = f"Concluído no dia {data}"
                bbox = draw.textbbox((0, 0), texto_data, font=fonte_pequena)
                largura_texto = bbox[2] - bbox[0]
                x_data = (img.width - largura_texto) / 2
                draw.text((x_data, 800), texto_data, fill="white", font=fonte_pequena)
                
                texto_min = f"Ministrado por: {apresentador}"
                bbox = draw.textbbox((0, 0), texto_min, font=fonte_pequena)
                largura_texto = bbox[2] - bbox[0]
                x_min = (img.width - largura_texto) / 2
                draw.text((x_min, 870), texto_min, fill="white", font=fonte_pequena)
                
                texto_carga = f"Carga horária: {carga}"
                bbox = draw.textbbox((0, 0), texto_carga, font=fonte_pequena)
                largura_texto = bbox[2] - bbox[0]
                x_carga = (img.width - largura_texto) / 2
                draw.text((x_carga, 940), texto_carga, fill="white", font=fonte_pequena)
            
            img_io = BytesIO()
            img.save(img_io, format='PNG')
            
            clean_name = "".join(x for x in nome if x.isalnum() or x in " -_").strip()
            zf.writestr(f"Certificado_{clean_name}.png", img_io.getvalue())
            
    memory_zip.seek(0)
    return send_file(memory_zip, mimetype='application/zip', as_attachment=True, download_name=f'Certificados_{modelo}.zip')

# GERADOR DE CARDÁPIO
# ---------------------------------------------------------
@app.route('/api/parse-cardapio', methods=['POST'])
def parse_cardapio():
    if 'file' not in request.files:
        return jsonify(error="Nenhum arquivo enviado."), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(error="Nenhum arquivo selecionado."), 400
    
    try:
        df = pd.read_excel(file, header=None, engine='openpyxl')
        
        def safe_get(r, c):
            try:
                v = df.iloc[r, c]
                return '' if pd.isna(v) else str(v)
            except IndexError:
                return ''
                
        try:
            d_inicio = pd.to_datetime(safe_get(1, 1))
            d_fim = pd.to_datetime(safe_get(1, 5))
            periodo = f'{d_inicio:%d/%m} a {d_fim:%d/%m}'
        except:
            periodo = "01/01 a 05/01"

        def texto_evento(t):
            return 'Sabor da Casa' if t.strip().lower() in {'segunda', 'terça', 'terca', 'quarta', 'quinta', 'sexta'} else t
            
        dias = ["segunda", "terca", "quarta", "quinta", "sexta"]
        dados = {"periodo": periodo, "dias": [], "differe": safe_get(12, 5)}
        
        for i, col in enumerate(range(1, 6)):
            dados["dias"].append({
                "dia": dias[i],
                "evento": texto_evento(safe_get(2, col)),
                "pratos": [safe_get(row, col) for row in (3, 4, 5, 6)]
            })
            
        return jsonify(dados)
    except Exception as e:
        app.logger.exception("Erro ao ler excel do cardápio")
        return jsonify(error="Não foi possível ler a planilha. Verifique o formato."), 500

@app.route('/api/cardapio-json', methods=['POST'])
def api_cardapio_json():
    data = request.json
    if not data:
        return jsonify(error="Dados inválidos"), 400
        
    try:
        base_path = os.path.join(ASSETS_DIR, 'cardapio_base.jpg')
        img = Image.open(base_path).convert('RGB')
        draw = ImageDraw.Draw(img)
        
        fonte_periodo = load_font('Exo-Bold.ttf', 46)
        fonte_prato = load_font('calibri.ttf', 20)
        fonte_evento = load_font('Exo-Bold.ttf', 24)
        
        draw.text((1150, 90), data.get('periodo', ''), fill='#13A8C8', font=fonte_periodo)
        
        coordenadas = (100, 375, 655, 930, 1205)
        linhas = (373, 465, 555, 655)
        
        def escrever_multilinha(x, y, texto):
            for index, linha in enumerate(quebra_texto_bbox(draw, fonte_prato, texto, 250)):
                draw.text((x, y + index * 25), linha, fill='#041621', font=fonte_prato)
                
        def escrever_evento(x, y, texto):
            for index, linha in enumerate(quebra_texto_bbox(draw, fonte_evento, texto, 250)):
                draw.text((x, y + index * 26), linha, fill='#041621', font=fonte_evento)

        for i, col_data in enumerate(data.get('dias', [])):
            x = coordenadas[i]
            evento = col_data.get('evento', '')
            escrever_evento(x, 270, evento)
            
            pratos = col_data.get('pratos', ['', '', '', ''])
            for y, prato in zip(linhas, pratos):
                escrever_multilinha(x, y, prato)
                
        escrever_multilinha(1205, 740, data.get('differe', ''))
        
        output = BytesIO()
        img.save(output, format='PNG')
        output.seek(0)
        return send_file(output, mimetype='image/png', as_attachment=True, download_name='Cardapio_Gerado.png')
    except Exception as e:
        app.logger.exception("Erro ao gerar cardápio json")
        return jsonify(error="Erro ao gerar imagem."), 500

# ---------------------------------------------------------
# GERADOR IKANEWS
# ---------------------------------------------------------

def arredondar_foto(imagem, radius=25):
    mask = Image.new('L', imagem.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, imagem.size[0], imagem.size[1]), radius=radius, fill=255)
    imagem.putalpha(mask)
    return imagem

def preparar_foto(file_storage, tamanho):
    if file_storage and file_storage.filename and '.' in file_storage.filename:
        try:
            img = Image.open(file_storage.stream).convert('RGBA')
            w, h = img.size
            menor = min(w, h)
            esquerda = (w - menor) // 2
            topo = (h - menor) // 2
            img = img.crop((esquerda, topo, esquerda + menor, topo + menor))
            img = img.resize((tamanho, tamanho))
            return arredondar_foto(img)
        except Exception:
            pass
    placeholder = Image.new('RGBA', (tamanho, tamanho), (21, 35, 57, 255))
    return arredondar_foto(placeholder)

def quebra_texto_simples(texto, limite=20):
    palavras = texto.split()
    linhas = []
    linha = ''
    for palavra in palavras:
        teste = f'{linha} {palavra}'.strip()
        if len(teste) <= limite:
            linha = teste
        else:
            linhas.append(linha)
            linha = palavra
    if linha:
        linhas.append(linha)
    return '\n'.join(linhas)

def gerar_ikanews_img(colaboradores):
    base_path = os.path.join(ASSETS_DIR, 'ikanews_fundo.png')
    if not os.path.exists(base_path):
        raise FileNotFoundError('Arquivo de fundo ikanews_fundo.png não encontrado.')

    base = Image.open(base_path).convert('RGBA')
    draw = ImageDraw.Draw(base)

    quantidade = len(colaboradores)
    if quantidade == 4:
        label_size, name_size, cargo_size = 20, 22, 22
    elif quantidade == 3:
        label_size, name_size, cargo_size = 22, 24, 24
    else:
        label_size, name_size, cargo_size = 24, 26, 26

    fonte_label = load_font('Disket-Mono-Bold.ttf', label_size)
    fonte_nome = load_font('Disket-Mono-Bold.ttf', name_size)
    fonte_cargo = load_font('Disket-Mono-Bold.ttf', cargo_size)

    largura_total = base.width
    if quantidade == 1:
        posicoes = [(largura_total - (284 + 260)) // 2]
    elif quantidade == 2:
        posicoes = [220, 1000]
    elif quantidade == 3:
        posicoes = [300, 820, 1340]
    else:
        posicoes = [250, 640, 1030, 1420]

    for i, colaborador in enumerate(colaboradores):
        x = posicoes[i]
        y = 400 if quantidade in (1, 2) else 330
        tamanho_foto = 284 if quantidade == 1 else 250

        foto = preparar_foto(colaborador['foto'], tamanho_foto)
        base.paste(foto, (x, y), foto)

        if quantidade == 1:
            text_x, text_y, nome_limite, cargo_limite = x + tamanho_foto + 40, y + 112, 18, 24
        elif quantidade == 2:
            text_x, text_y, nome_limite, cargo_limite = x + tamanho_foto + 20, y + 90, 18, 24
        else:
            text_x, text_y, nome_limite, cargo_limite = x, y + tamanho_foto + 14, 16, 18

        nome_text = quebra_texto_simples(colaborador['nome'].upper(), limite=nome_limite)
        cargo_text = quebra_texto_simples(colaborador['cargo'].upper(), limite=cargo_limite)

        label_spacing = 28
        draw.text((text_x, text_y), 'NOME', fill='white', font=fonte_label)
        draw.multiline_text((text_x, text_y + label_spacing), nome_text, fill='#08CFFF', font=fonte_nome, spacing=1)

        nome_lines = nome_text.count('\n') + 1
        line_height = int(name_size * 1.2)
        cargo_label_y = text_y + label_spacing + nome_lines * line_height + label_spacing

        draw.text((text_x, cargo_label_y), 'CARGO', fill='white', font=fonte_label)
        draw.multiline_text((text_x, cargo_label_y + label_spacing), cargo_text, fill='#08CFFF', font=fonte_cargo, spacing=1)

    output = BytesIO()
    base.save(output, format='PNG', quality=95)
    output.seek(0)
    return output, f'IKANEWS_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png'

@app.route('/api/ikanews', methods=['POST'])
def api_ikanews():
    try:
        quantidade = int(request.form.get('quantidade', '1'))
    except ValueError:
        quantidade = 1

    colaboradores = []
    for i in range(1, quantidade + 1):
        nome = request.form.get(f'nome_{i}', '').strip()
        cargo = request.form.get(f'cargo_{i}', '').strip()
        foto = request.files.get(f'foto_{i}')

        if not (nome and cargo):
            return jsonify(error=f'Informe nome e cargo para o colaborador {i}.'), 400

        colaboradores.append({'nome': nome, 'cargo': cargo, 'foto': foto})

    try:
        img_io, filename = gerar_ikanews_img(colaboradores)
        return send_file(img_io, mimetype='image/png', as_attachment=True, download_name=filename)
    except FileNotFoundError as exc:
        return jsonify(error=str(exc)), 500
    except Exception as exc:
        app.logger.exception("Erro ao gerar arte IKANEWS")
        return jsonify(error="Ocorreu um erro ao gerar a arte do IKANEWS."), 500

# ---------------------------------------------------------
# GERADOR DE CERTIFICADO
# ---------------------------------------------------------


@app.route('/')
def index():
    return render_template('index.html')

@app.after_request
def add_header(r):
    r.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    r.headers['Pragma'] = 'no-cache'
    r.headers['Expires'] = '0'
    return r

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5050))
    print(f"Starting Flask development server on http://0.0.0.0:{port} with auto-reload")
    # Using app.run with debug=True enables auto-reloading
    app.run(host='0.0.0.0', port=port, debug=True)
