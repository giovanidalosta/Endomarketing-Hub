with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/app.py', 'r', encoding='utf-8') as f:
    app = f.read()

app = app.replace('\ufeff', '')

with open('c:/Users/GiovaniFreitas/Desktop/Projetos/ikatec-geradores/app.py', 'w', encoding='utf-8') as f:
    f.write(app)