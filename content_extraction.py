import bs4
import os
import glob

def extract_content(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        soup = bs4.BeautifulSoup(f, 'html.parser')

    slides = soup.find_all(class_='slide')
    markdown_output = []
    
    file_basename = os.path.basename(file_path)
    markdown_output.append(f"# Presentation: {file_basename}\n")

    for i, slide in enumerate(slides):
        title = slide.get('data-title', f'Slide {i+1}')
        markdown_output.append(f"## Slide {i+1}: {title}\n")
        
        # Extract content
        # H1 - likely title
        h1 = slide.find('h1')
        if h1:
            markdown_output.append(f"# {h1.get_text(strip=True)}\n")
        
        # H2 - likely subtitle/header
        h2 = slide.find('h2')
        if h2:
            markdown_output.append(f"## {h2.get_text(strip=True)}\n")
            
        # P - paragraphs
        paragraphs = slide.find_all('p')
        for p in paragraphs:
            text = p.get_text(strip=True)
            if text:
                markdown_output.append(f"{text}\n")
                
        # Lists
        lis = slide.find_all('li')
        if lis:
            markdown_output.append("\n")
            for li in lis:
                text = li.get_text(strip=True)
                if text:
                     markdown_output.append(f"- {text}")
            markdown_output.append("\n")

        # Key cards/scenarios (specific to these decks)
        cards = slide.find_all(class_=['card', 'scenario', 'tp'])
        if cards:
             markdown_output.append("\n### Cards/Scenarios:\n")
             for card in cards:
                 # Try to find a title within the card
                 card_title = card.find(class_=['card-title', 'sc-title', 'tp-name'])
                 card_desc = card.find(class_=['card-desc', 'sc-after', 'tp-desc'])
                 
                 if card_title:
                     markdown_output.append(f"- **{card_title.get_text(strip=True)}**")
                 if card_desc:
                     markdown_output.append(f"  - {card_desc.get_text(strip=True)}")

        markdown_output.append("\n---\n")

    return "\n".join(markdown_output)

def main():
    target_dir = "/Users/turnybator/Desktop/makeden/makeden-anyagok/ai-oktatoanyag"
    html_files = [
        "slides.html",
        "slides-kkv.html",
        "slides-google-workspace.html"
    ]
    
    full_output = ""
    
    for html_file in html_files:
        full_path = os.path.join(target_dir, html_file)
        if os.path.exists(full_path):
            print(f"Processing {full_path}...")
            full_output += extract_content(full_path)
            full_output += "\n\n========================================\n\n"
        else:
            print(f"Skipping {html_file} (not found)")

    output_path = "draft_material.md"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(full_output)
    
    print(f"Extraction complete. Saved to {output_path}")

if __name__ == "__main__":
    main()
