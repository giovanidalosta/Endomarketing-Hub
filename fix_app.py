import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """def quebrar_texto(draw, texto, largura_max, fonte):
    if not texto: return []
    palavras = texto.split()
    linhas = []
    linha = ""
    for palavra in palavras:
        teste = linha + " " + palavra if linha else palavra
        bbox = draw.textbbox((0, 0), teste, font=fonte)
        largura = bbox[2] - bbox[0]
        if largura <= largura_max:
            linha = teste
        else:
            if linha: linhas.append(linha)
            linha = palavra
    if linha:
        linhas.append(linha)
    return linhas

def escrever_multilinha(draw, x, y, texto, largura_max, fonte):
    linhas = quebrar_texto(draw, texto, largura_max, fonte)
    for i, linha in enumerate(linhas):
        draw.text((x, y + (i * 50)), linha, fill="white", font=fonte)

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
    except:
        fonte_nome = ImageFont.load_default()
        fonte_curso = ImageFont.load_default()
        fonte_info = ImageFont.load_default()

    nomes = [n.strip() for n in nomes_lote.split('\\n') if n.strip()]
    curso = request.form.get("curso", "").strip()
    carga = request.form.get("carga", "").strip()
    data = request.form.get("data", "").strip()
    tema = request.form.get("tema", "").strip()
    apresentador = request.form.get("apresentador", "").strip()
    
    memory_zip = BytesIO()
    import zipfile
    with zipfile.ZipFile(memory_zip, 'w', zipfile.ZIP_DEFLATED) as zf:
        for nome in nomes:
            img = base_img.copy()
            draw = ImageDraw.Draw(img)
            
            if modelo == 'alura':
                Y_NOME = 270
                AJUSTE_X_NOME = 60
                AJUSTE_Y_NOME = 0
                bbox = draw.textbbox((0, 0), nome, font=fonte_nome)
                largura_texto = bbox[2] - bbox[0]
                x_nome = ((img.width - largura_texto) / 2) + AJUSTE_X_NOME
                draw.text((x_nome, Y_NOME + AJUSTE_Y_NOME), nome, fill="white", font=fonte_nome)

                escrever_multilinha(draw, 480, 470, curso, 1000, fonte_curso)
                draw.text((480, 650), carga, fill="white", font=fonte_info)
                draw.text((930, 650), data, fill="white", font=fonte_info)
                
            else:
                bbox = draw.textbbox((0, 0), nome, font=fonte_nome)
                largura_texto = bbox[2] - bbox[0]
                x_nome = (img.width - largura_texto) / 2
                draw.text((x_nome, 270), nome, fill="white", font=fonte_nome)
                escrever_multilinha(draw, 320, 560, tema, 1000, fonte_info)
                escrever_multilinha(draw, 320, 710, apresentador, 1000, fonte_info)
            
            img_io = BytesIO()
            img.save(img_io, format='PNG')
            
            clean_name = "".join(x for x in nome if x.isalnum() or x in " -_").strip()
            zf.writestr(f"Certificado_{clean_name}.png", img_io.getvalue())
            
    memory_zip.seek(0)
    return send_file(memory_zip, mimetype='application/zip', as_attachment=True, download_name=f'Certificados_{modelo}.zip')
"""

pattern = re.compile(r"def desenhar_texto\(draw.*?# INTERFACE PRINCIPAL", re.DOTALL)
new_content = pattern.sub(replacement + "\n# INTERFACE PRINCIPAL", content)

with open("app.py", "w", encoding="utf-8") as f:
    f.write(new_content)
