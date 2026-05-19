import os

# Helper to build a run block reusing existing rPr style from slide1
RUN_TPL = '<a:r><a:rPr lang="cs-CZ" dirty="0"/><a:t>{text}</a:t></a:r>'

def para(text):
    return f'<a:p>{RUN_TPL.format(text=text)}</a:p>'

def empty_endpara():
    return '<a:p><a:endParaRPr lang="cs-CZ" dirty="0"/></a:p>'

# Slide 1: Titulní strana
s1 = open("pptx_xml/ppt/slides/slide1.xml", encoding="utf-8").read()
s1 = s1.replace(
    "<a:t>Název práce</a:t>",
    "<a:t>Využití platformy umělé inteligence ve výuce odborných předmětů</a:t>"
)
s1 = s1.replace("<a:t>Autor práce</a:t>", "<a:t>Jakub Bednář</a:t>")
s1 = s1.replace("<a:t>Vedoucí práce:</a:t>", "<a:t>Vedoucí práce: [doplňte jméno]</a:t>")
s1 = s1.replace("<a:t>Oponent práce:</a:t>", "<a:t>Oponent práce: [doplňte jméno]</a:t>")
open("pptx_xml/ppt/slides/slide1.xml", "w", encoding="utf-8").write(s1)

def inject_into_slide(slide_num, idx15_content):
    path = f"pptx_xml/ppt/slides/slide{slide_num}.xml"
    xml = open(path, encoding="utf-8").read()

    old_block = '<p:ph type="body" sz="quarter" idx="15"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="cs-CZ"/></a:p></p:txBody>'
    new_block = f'<p:ph type="body" sz="quarter" idx="15"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>{idx15_content}</p:txBody>'
    xml = xml.replace(old_block, new_block)
    
    old_block2 = '<p:ph type="body" sz="quarter" idx="15"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="cs-CZ" dirty="0"/></a:p></p:txBody>'
    xml = xml.replace(old_block2, new_block)

    open(path, "w", encoding="utf-8").write(xml)

# Slide 2: Obsah - replacing just the words to keep bullet structure if it existed
s2 = open("pptx_xml/ppt/slides/slide2.xml", encoding="utf-8").read()
s2 = s2.replace("<a:t>struktura</a:t>", "1. Úvod a cíle práce</a:t></a:r></a:p><a:p><a:r><a:rPr lang=\"cs-CZ\" dirty=\"0\"/><a:t>2. Metodika výzkumu</a:t></a:r></a:p><a:p><a:r><a:rPr lang=\"cs-CZ\" dirty=\"0\"/><a:t>3. Hlavní výsledky a paradoxy</a:t></a:r></a:p><a:p><a:r><a:rPr lang=\"cs-CZ\" dirty=\"0\"/><a:t>4. Závěr a přínos práce")
open("pptx_xml/ppt/slides/slide2.xml", "w", encoding="utf-8").write(s2)

# Slide 3: Cíl
inject_into_slide(3, "".join([
    para("Zmapovat reálný stav využívání generativní AI na středních odborných školách (IT obory)."),
    para("Analyzovat rozdíly v postoji studentů vs. pedagogů k AI jako vzdělávacímu nástroji."),
    para("Navrhnout konkrétní způsoby začlenění AI do výuky podporující analytické myšlení."),
]))

# Slide 4: Metodika
inject_into_slide(4, "".join([
    para("Design smíšeného výzkumu (Mixed Methods Research)."),
    para("Kvantitativní část: dotazníkové šetření — 240 studentů SOŠ (IT a technické obory)."),
    para("Kvalitativní část: polostrukturované rozhovory — 12 pedagogů různých aprobací a délky praxe."),
]))

# Slide 5: Výsledky
inject_into_slide(5, "".join([
    para("76,7 % studentů využívá AI alespoň jednou týdně (převážně jako doučovatele)."),
    para("Vysoká míra kritičnosti: 43 % studentů si výstupy AI aktivně ověřuje."),
    para("Identifikováno „Institucionální vakuum“ – 40 % studentů nezná pravidla své školy pro práci s AI."),
    para("Pedagogové pociťují ztrátu kontroly a stres; rozdělují se na striktní „zakazovače“ a „integrátory“."),
]))

# Slide 6: Závěr a přínos
inject_into_slide(6, "".join([
    para("Nutnost přesunu těžiště výuky k formativnímu hodnocení a ústní obhajobě."),
    para("AI jako ideální nástroj pro projektovou a kooperativní výuku."),
    para("Transformace role pedagoga z „přenašeče informací“ na facilitátora učení."),
    para("„Kdo se s AI naučí pracovat, neztratí práci. Nahradí nás ti, kteří AI používají.“"),
]))

# Slide 7: Zdroje
inject_into_slide(7, "".join([
    para("NPI ČR (2023). Doporučení pro využívání umělé inteligence ve školách."),
    para("HOLMES, W. et al. (2022). Artificial Intelligence in Education. Springer."),
    para("LUCKIN, R. et al. (2016). Intelligence Unleashed: An argument for AI in Education."),
    para("OECD (2023). Generative Artificial Intelligence in Education and Skills."),
]))

# Slide 8: Otázky
inject_into_slide(8, "".join([
    para("Děkuji za pozornost."),
    para("Prostor pro dotazy oponenta a vážené komise."),
]))

print("Všechny slajdy zapsány!")
