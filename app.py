import os
import io
from io import BytesIO
from datetime import datetime
import pandas as pd
from PIL import Image, ImageDraw, ImageFont
from flask import Flask, request, jsonify, send_file, render_template

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
FONTS_DIR = os.path.join(ASSETS_DIR, 'fontes')

def load_font(filename, size, bold=False):
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

# ---------------------------------------------------------
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
        
        fonte_periodo = load_font('Exo-Bold.ttf', 46, bold=True)
        fonte_prato = load_font('calibri.ttf', 20, bold=False)
        fonte_evento = load_font('Exo-Bold.ttf', 24, bold=True)
        
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

    fonte_label = load_font('Disket-Mono-Bold.ttf', label_size, bold=True)
    fonte_nome = load_font('Disket-Mono-Bold.ttf', name_size, bold=True)
    fonte_cargo = load_font('Disket-Mono-Bold.ttf', cargo_size, bold=True)

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

import zipfile

def desenhar_texto(draw, conf, texto, bbox_w=1000):
    if not texto or not conf: return
    try:
        top_str = conf.get("top", "0").replace("px", "")
        left_str = conf.get("left", "0").replace("px", "")
        color_str = conf.get("color", "white")
        font_size_str = str(conf.get("fontSize", "")).replace("px", "")
        show_label = conf.get("showLabel", False)
        label_text = conf.get("label", "CAMPO").upper()
        
        y = float(top_str) - 40
        
        is_center = False
        if "50%" in left_str or "translateX(-50%)" in conf.get("transform", ""):
            is_center = True
            
        font_size = 50
        if font_size_str:
            try:
                font_size = int(float(font_size_str))
            except:
                pass
        elif is_center:
            font_size = 105
            
        font = load_font("Exo-Regular.ttf", font_size)
        label_font = load_font("Exo-Regular.ttf", int(font_size * 0.4))
        
        if is_center:
            bbox = draw.textbbox((0, 0), texto, font=font)
            w_text = bbox[2] - bbox[0]
            x = ((1684 - w_text) / 2) + 60
            
            if show_label:
                label_bbox = draw.textbbox((0, 0), label_text, font=label_font)
                label_w = label_bbox[2] - label_bbox[0]
                label_x = ((1684 - label_w) / 2) + 60
                draw.text((label_x, y), label_text, fill="#08CFFF", font=label_font)
                y += (font_size * 0.4) + 15
                
            draw.text((x, y), texto, fill=color_str, font=font)
        else:
            try:
                x = float(left_str)
            except:
                x = 480
                
            if show_label:
                draw.text((x, y), label_text, fill="#08CFFF", font=label_font)
                y += (font_size * 0.4) + 15
                
            linhas = quebra_texto_bbox(draw, font, texto, bbox_w)
            for i, linha in enumerate(linhas):
                draw.text((x, y + (i * font_size * 1.2)), linha, fill=color_str, font=font)
                
    except Exception as e:
        print(f"Error drawing {texto}: {e}")

@app.route('/api/certificados-lote', methods=['POST'])
def api_certificados_lote():
    modelo = request.form.get("modelo", "alura")
    nomes_lote = request.form.get("nomes_lote", "").strip()
    if not nomes_lote:
        return jsonify(error="A lista de nomes está vazia."), 400
        
    cfg = load_certificado_config().get(modelo, {})
    
    # fallback to default if image doesn't exist
    base_path = os.path.join(ASSETS_DIR, f"certificado_base_{modelo}.png")
    if not os.path.exists(base_path):
        base_path = os.path.join(ASSETS_DIR, "certificado_base.png")
        
    try:
        base_img = Image.open(base_path)
    except:
        return jsonify(error="Imagem base não encontrada."), 500

    nomes = [n.strip() for n in nomes_lote.split('\n') if n.strip()]
    
    memory_zip = BytesIO()
    with zipfile.ZipFile(memory_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for nome in nomes:
            img = base_img.copy()
            draw = ImageDraw.Draw(img)
            
            desenhar_texto(draw, cfg.get("cert-nome-txt"), nome)
            desenhar_texto(draw, cfg.get("cert-curso-txt"), request.form.get("curso"))
            desenhar_texto(draw, cfg.get("cert-carga-txt"), request.form.get("carga"))
            desenhar_texto(draw, cfg.get("cert-data-txt"), request.form.get("data"))
            desenhar_texto(draw, cfg.get("cert-tema-txt"), request.form.get("tema"))
            desenhar_texto(draw, cfg.get("cert-apresentador-txt"), request.form.get("apresentador"))
            
            for k in cfg.keys():
                if k.startswith("cert-extra_"):
                    field_id = k.replace("cert-", "").replace("-txt", "")
                    desenhar_texto(draw, cfg[k], request.form.get(field_id))
            
            img_io = BytesIO()
            img.save(img_io, format='PNG')
            
            clean_name = "".join(x for x in nome if x.isalnum() or x in " -_").strip()
            zf.writestr(f"Certificado_{clean_name}.png", img_io.getvalue())
            
    memory_zip.seek(0)
    return send_file(memory_zip, mimetype='application/zip', as_attachment=True, download_name=f'Certificados_{modelo}.zip')

# ---------------------------------------------------------
# INTERFACE PRINCIPAL
# ---------------------------------------------------------

import json

CONFIG_FILE = os.path.join(ASSETS_DIR, 'certificado_config.json')

def load_certificado_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "alura": {
            "cert-nome-txt": {"top": "310px", "left": "calc(50% + 60px)", "transform": "translateX(-50%)"},
            "cert-curso-txt": {"top": "500px", "left": "480px"},
            "cert-carga-txt": {"top": "680px", "left": "480px"},
            "cert-data-txt": {"top": "680px", "left": "930px"}
        },
        "ikated": {
            "cert-nome-txt": {"top": "310px", "left": "calc(50% + 60px)", "transform": "translateX(-50%)"},
            "cert-tema-txt": {"top": "500px", "left": "480px"},
            "cert-apresentador-txt": {"top": "680px", "left": "480px"}
        },
        "generico": {
            "cert-nome-txt": {"top": "310px", "left": "calc(50% + 60px)", "transform": "translateX(-50%)"}
        }
    }

@app.route('/api/certificado-config', methods=['GET', 'POST'])
def api_certificado_config():
    modelo = request.args.get('modelo', 'alura')
    cfg = load_certificado_config()
    
    if request.method == 'POST':
        data = request.json
        cfg[modelo] = data
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(cfg, f)
        return jsonify(success=True)
        
    return jsonify(cfg.get(modelo, cfg['alura']))

@app.route('/api/upload-certificado-bg', methods=['POST'])
def api_upload_certificado_bg():
    if 'file' not in request.files:
        return jsonify(error="Nenhum arquivo enviado."), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify(error="Nenhum arquivo selecionado."), 400
    
    modelo = request.args.get('modelo', 'alura')
    filename = f'certificado_base_{modelo}.png'
    
    try:
        static_path = os.path.join(os.path.dirname(__file__), 'static', filename)
        assets_path = os.path.join(ASSETS_DIR, filename)
        
        img = Image.open(file.stream).convert("RGBA")
        img.save(static_path, "PNG")
        img.save(assets_path, "PNG")
        
        return jsonify(success=True)
    except Exception as e:
        app.logger.exception("Erro ao salvar o fundo do certificado")
        return jsonify(error="Erro ao salvar a imagem."), 500

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
    from waitress import serve
    port = int(os.environ.get('PORT', 5050))
    print(f"Starting Waitress server on http://0.0.0.0:{port}")
    serve(app, host='0.0.0.0', port=port)