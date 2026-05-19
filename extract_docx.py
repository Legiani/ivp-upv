import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_text(docx_filename):
    try:
        document = zipfile.ZipFile(docx_filename)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.XML(xml_content)
        
        NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        TEXT = NAMESPACE + 't'
        
        paragraphs = []
        for paragraph in tree.iter(NAMESPACE + 'p'):
            texts = [node.text for node in paragraph.iter(TEXT) if node.text]
            if texts:
                paragraphs.append(''.join(texts))
        
        return '\n'.join(paragraphs)
    except Exception as e:
        return f"Error extracting {docx_filename}: {e}"

if __name__ == '__main__':
    for filename in sys.argv[1:]:
        print(extract_text(filename))
