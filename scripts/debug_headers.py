
import json
import re

def detect_headers(filepath):
    encodings = ['utf-16', 'utf-8', 'gbk']
    lines = []
    
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                lines = f.readlines()
            print(f"Read with {enc}")
            break
        except UnicodeError:
            continue

    headers = []
    for i, line in enumerate(lines):
        # Clean up
        l = line.strip().replace('"', '')
        parts = l.split('\t')
        
        # Heuristic: If it contains "Chapter" or "Test Paper"
        if "Chapter" in l or "Test Paper" in l:
            headers.append((i+1, l, parts))
            
    return headers

headers = detect_headers('/Users/chenhaihong/DOC/W/IELTS/Listening/Try/1.txt')
for h in headers:
    print(h)
