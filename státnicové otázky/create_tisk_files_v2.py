import os
import subprocess

base_dir = "/Users/jakubbednar/Documents/ivp-upv/státnicové otázky"
os.chdir(base_dir)

# Define the 3 okruhy
okruhy = [
    {
        "pdf": "../upv-otazky-pedagogika-a-socialni-aspekty-pedagogiky.pdf",
        "folder": "A - Pedagogika",
        "output": "01_Pedagogika_TISK.md"
    },
    {
        "pdf": "../upv-otazky-oborova-didaktika-a-praxe.pdf",
        "folder": "B - Oborová didaktika",
        "output": "02_Oborova_didaktika_TISK.md"
    },
    {
        "pdf": "../upv-otazky-psychologie.pdf",
        "folder": "C - Psychologie",
        "output": "03_Psychologie_TISK.md"
    }
]

for okruh in okruhy:
    out_path = okruh["output"]
    with open(out_path, "w", encoding="utf-8") as out:
        
        pdf_text = ""
        heading_lines = []
        if okruh["pdf"] and os.path.exists(okruh["pdf"]):
            try:
                # Use pdftotext to extract text
                result = subprocess.run(["pdftotext", okruh["pdf"], "-"], capture_output=True, text=True, check=True)
                pdf_text = result.stdout.replace('\x0c', '\n\n---\n\n')
                
                # Extract EXACT headings from the top of the PDF
                lines = [l.strip() for l in pdf_text.splitlines() if l.strip()]
                if len(lines) >= 3:
                    heading_lines = lines[:3]
                
            except Exception as e:
                pdf_text = f"Chyba při extrakci PDF: {e}\n"
        
        # 1. Uvodni list s nazvem (Title page)
        if heading_lines:
            # heading_lines[2] is typically the specific subject name, [0] and [1] are the general info
            out.write(f"# {heading_lines[2]}\n\n")
            out.write(f"### {heading_lines[0]}\n")
            out.write(f"### {heading_lines[1]}\n\n")
        else:
            out.write(f"# {okruh['folder']}\n\n")
            
        out.write("<div style='page-break-after: always;'></div>\n\n")
        
        # 2. Seznam otazek z pdf
        out.write("## Seznam otázek z PDF\n\n")
        if pdf_text:
            out.write(pdf_text)
        else:
            out.write("PDF se seznamem otázek nebylo nalezeno.\n")
            
        out.write("\n<div style='page-break-after: always;'></div>\n\n")
        
        # 3. Vsechny soubory za sebou
        folder = okruh["folder"]
        out.write(f"## Zpracované materiály\n\n")
        
        md_files = []
        if os.path.exists(folder):
            for f in os.listdir(folder):
                if f.endswith(".md"):
                    md_files.append(f)
            
            # Sort files alphabetically
            md_files.sort()
            
            if not md_files:
                out.write("V této složce zatím nejsou žádné zpracované materiály (.md).\n")
            else:
                for idx, md_file in enumerate(md_files):
                    file_path = os.path.join(folder, md_file)
                    with open(file_path, "r", encoding="utf-8") as f_in:
                        content = f_in.read()
                        out.write(content)
                        out.write("\n\n<div style='page-break-after: always;'></div>\n\n")
        else:
            out.write(f"Složka '{folder}' nebyla nalezena.\n")

print("Hotovo! Nove soubory byly vytvořeny.")
