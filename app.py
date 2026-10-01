from flask import Flask, render_template, request, send_file, jsonify, send_from_directory, redirect
import os
import json
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import zipfile
import base64

app = Flask(__name__)
app.secret_key = "secreto_ikatec"
ASSETS_DIR = os.path.join(app.root_path, "assets")

def load_certificado_config():
    path = os.path.join(app.root_path, "certificado_config.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def save_certificado_config(data):
    path = os.path.join(app.root_path, "certificado_config.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

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
