import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

def replacer(match):
    indent = match.group(1)
    return indent + "else:\n" + """{indent}    try:
{indent}        fonte_pequena = ImageFont.truetype(fonte_path, 36)
{indent}    except:
{indent}        fonte_pequena = ImageFont.load_default()
{indent}        
{indent}    # CERTIFICADO DE PARTICIPAÇÃO
{indent}    draw.text((150, 250), "CERTIFICADO DE PARTICIPAÇÃO", fill="white", font=fonte_pequena)
{indent}    
{indent}    # Nome
{indent}    draw.text((150, 320), nome, fill="white", font=fonte_nome)
{indent}    
{indent}    # Certificamos que participou...
{indent}    texto_tema = f"Certificamos que participou do IKATED: {tema}"
{indent}    bbox = draw.textbbox((0, 0), texto_tema, font=fonte_curso)
{indent}    largura_texto = bbox[2] - bbox[0]
{indent}    x_tema = (img.width - largura_texto) / 2
{indent}    draw.text((x_tema, 550), texto_tema, fill="white", font=fonte_curso)
{indent}    
{indent}    # Concluído no dia
{indent}    texto_data = f"Concluído no dia {data}"
{indent}    bbox = draw.textbbox((0, 0), texto_data, font=fonte_pequena)
{indent}    largura_texto = bbox[2] - bbox[0]
{indent}    x_data = (img.width - largura_texto) / 2
{indent}    draw.text((x_data, 800), texto_data, fill="white", font=fonte_pequena)
{indent}    
{indent}    # Ministrado por
{indent}    texto_min = f"Ministrado por: {apresentador}"
{indent}    bbox = draw.textbbox((0, 0), texto_min, font=fonte_pequena)
{indent}    largura_texto = bbox[2] - bbox[0]
{indent}    x_min = (img.width - largura_texto) / 2
{indent}    draw.text((x_min, 870), texto_min, fill="white", font=fonte_pequena)
{indent}    
{indent}    # Carga horária
{indent}    texto_carga = f"Carga horária: {carga}"
{indent}    bbox = draw.textbbox((0, 0), texto_carga, font=fonte_pequena)
{indent}    largura_texto = bbox[2] - bbox[0]
{indent}    x_carga = (img.width - largura_texto) / 2
{indent}    draw.text((x_carga, 940), texto_carga, fill="white", font=fonte_pequena)""".replace("{indent}", indent) + "\n" + indent + "    img_io = BytesIO()"


pattern = re.compile(r"([ \t]+)else:.*?img_io = BytesIO\(\)", re.DOTALL)
content = pattern.sub(replacer, content)

with open("app.py", "w", encoding="utf-8") as f:
    f.write(content)
