import re
import os

md_dir = "/Users/jakubbednar/Documents/ivp-upv/státnicové otázky/A - Pedagogika"
temp_file = "/Users/jakubbednar/Documents/ivp-upv/temp.txt"

with open(temp_file, "r", encoding="utf-8") as f:
    temp_text = f.read()

# We need a robust way to find authors (words starting with Capital letter, ignoring start of sentences)
# A simple heuristic: look for "podle [Name]" or "Autor: [Name]" or just lists of names.
def extract_authors(text):
    authors = set()
    matches = re.findall(r"podle\s+([A-Z][a-zá-ž]+(?:\s+[A-Z][a-zá-ž]+)?)", text)
    for m in matches:
        authors.add(m.strip())
    # Find names in brackets e.g. (Průcha, Walter, Mareš)
    matches2 = re.findall(r"\(([A-Z][a-zá-ž]+(?:,\s*[A-Z][a-zá-ž]+)*)\)", text)
    for m in matches2:
        for name in m.split(','):
            authors.add(name.strip())
    return authors

def extract_typologies(text):
    typologies = []
    # find lines that start with a bullet point • or -
    lines = text.split('\n')
    current_list = []
    for line in lines:
        line = line.strip()
        if line.startswith('•') or line.startswith('-'):
            # extract the first few words as the key
            clean_line = line.lstrip('•- ').strip()
            key = clean_line.split(':')[0].split('–')[0].split('-')[0].strip()
            if len(key.split()) <= 5: # likely a category name
                current_list.append(key)
        else:
            if current_list and len(current_list) > 1:
                typologies.append(current_list)
            current_list = []
    if current_list and len(current_list) > 1:
        typologies.append(current_list)
    return typologies

authors = extract_authors(temp_text)
print("--- AUTOŘI V PŮVODNÍCH TEXTECH ---")
print(sorted(list(authors)))

print("\n--- TYPOLOGIE V PŮVODNÍCH TEXTECH ---")
typos = extract_typologies(temp_text)
for t in typos[:10]: # Print first 10 for inspection
    print(t)

