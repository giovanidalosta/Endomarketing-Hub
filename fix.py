import re

with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/app.py', 'r', encoding='utf-8') as f:
    app = f.read()

# I will find the parse_cardapio block and just replace it cleanly
start = app.find("def parse_cardapio():")
end = app.find("def api_cardapio_json():")

original_block = app[start:end]

# Rewrite the block to correctly use the safe get function
new_block = """def parse_cardapio():
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
"""

app = app.replace(original_block, new_block)

with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/app.py', 'w', encoding='utf-8') as f:
    f.write(app)
