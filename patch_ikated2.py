import re

with open("app.py", "r", encoding="utf-8") as f:
    content = f.read()

def get_ikated_code():
    return """
        try:
            fonte_pequena = ImageFont.truetype(fonte_path, 36)
        except:
            fonte_pequena = ImageFont.load_default()
            
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
        draw.text((x_carga, 940), texto_carga, fill="white", font=fonte_pequena)"""

# Update api_certificados_lote
part1, part2 = content.split("            else:\n                bbox = draw.textbbox((0, 0), nome, font=fonte_nome)", 1)
part2_after = part2.split("img_io = BytesIO()", 1)[1]
content = part1 + "            else:" + get_ikated_code() + "\n            \n            img_io = BytesIO()" + part2_after

# Update api_preview_certificado
part1, part2 = content.split("    else:\n        bbox = draw.textbbox((0, 0), nome, font=fonte_nome)", 1)
part2_after = part2.split("img_io = BytesIO()", 1)[1]
content = part1 + "    else:" + get_ikated_code().replace("        ", "    ") + "\n\n    img_io = BytesIO()" + part2_after

with open("app.py", "w", encoding="utf-8") as f:
    f.write(content)
