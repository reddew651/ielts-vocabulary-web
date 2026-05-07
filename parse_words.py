import json
import re

def parse_file(file_path):
    chapters = []
    
    # Track current context
    current_chapter_num = None
    current_paper_list = []
    current_paper_name = None
    
    # Regex Patterns
    # Header example: "Chapter3 Test Paper 1" or "Chapter4 Test Paper 4 adverb"
    # Some headers have leading quote marks like: "Chapter3 Test Paper 1
    # Captures: (ChapterNum, PaperSuffix)
    header_pattern = re.compile(r'^"?Chapter(\d+)\s+Test\s+Paper\s+(.*?)(\t+|$)')
    
    try:
        # Try UTF-16 first as many Windows/Excel exports use it
        with open(file_path, 'r', encoding='utf-16') as f:
            lines = f.readlines()
    except UnicodeError:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
        except UnicodeError:
             # Fallback
            with open(file_path, 'r', encoding='latin-1') as f: # ISO-8859-1
                lines = f.readlines()

    # We need a robust way to collect papers into chapters since they might be interspersed?
    # No, assuming sequential processing is safer.
    
    # Store all parsed data temporarily
    all_papers = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check for Header
        header_match = header_pattern.match(line)
        if header_match:
            # Found a new paper start
            chapter_num = header_match.group(1)
            paper_suffix = header_match.group(2).strip()
            
            # Create a paper object
            new_paper = {
                "chapter_id": chapter_num,
                "id": f"{chapter_num}-{paper_suffix.replace(' ', '_')}", # Unique ID
                "name": f"Test Paper {paper_suffix}", 
                "words": []
            }
            all_papers.append(new_paper)
            continue

        # Process as a Word Line if we have an active paper
        if all_papers:
            current_paper = all_papers[-1]
            parts = [p.strip() for p in line.split('\t') if p.strip()]
            
            # Heuristic for word line: Must start with a number (ID)
            # 1   能力    ability
            if len(parts) >= 3 and parts[0].isdigit():
                # Check if it looks valid
                word_id = parts[0]
                cn_meaning = parts[1]
                en_word = parts[2]
                
                # Filter out obvious non-words
                if en_word == "错误" or en_word == "正确":
                    continue
                
                current_paper["words"].append({
                    "id": word_id,
                    "word": en_word,
                    "translation": cn_meaning
                })

    # Regroup into Chapter Structure
    # { "id": "3", "name": "Chapter 3", "papers": [...] }
    chapter_map = {}
    
    allowed_chapters = ["3", "4", "5", "11"]

    for paper in all_papers:
        c_id = paper['chapter_id']
        
        # FILTER: Only allow specific chapters
        if c_id not in allowed_chapters:
            continue

        if c_id not in chapter_map:
            chapter_map[c_id] = {
                "id": c_id,
                "name": f"Chapter {c_id}",
                "papers": []
            }
        
        # Clean up the temp key
        del paper['chapter_id']
        chapter_map[c_id]['papers'].append(paper)
    
    # Convert to list and sort by integer ID
    start_sorted = sorted(chapter_map.values(), key=lambda x: int(x['id']) if x['id'].isdigit() else 999)
    return start_sorted

source_file = '1.txt'
output_file = 'public/data.json'
print(f"Parsing {source_file}...")

data = parse_file(source_file)

# Write to JSON file
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Successfully processed {len(data)} chapters.")
for ch in data:
    word_count = sum(len(p['words']) for p in ch['papers'])
    print(f"  {ch['name']}: {len(ch['papers'])} papers, {word_count} words")
