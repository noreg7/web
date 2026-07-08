import os
import re
import json
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

SOURCE_DIR = r"c:\Users\aadit\.gemini\antigravity\scratch\modern-hub\SourceMDs"
OUTPUT_FILE = r"c:\Users\aadit\.gemini\antigravity\scratch\modern-hub\resources-data.js"
CACHE_FILE = r"c:\Users\aadit\.gemini\antigravity\scratch\modern-hub\descriptions-cache.json"

# Map filename to user-friendly category name and details
CATEGORY_MAP = {
    "beginners-guide": {"title": "Beginners Guide", "icon": "book-open", "color": "#D05A6E"},
    "privacy": {"title": "Privacy & Adblocking", "icon": "shield", "color": "#D05A6E"},
    "ai": {"title": "Artificial Intelligence", "icon": "cpu", "color": "#91989F"},
    "video": {"title": "Movies & Shows", "icon": "tv", "color": "#7aa2f7"},
    "audio": {"title": "Music & Audio", "icon": "music", "color": "#7c82fe"},
    "gaming": {"title": "Gaming Hub", "icon": "gamepad", "color": "#49d3e9"},
    "reading": {"title": "Books & Manga", "icon": "book", "color": "#3ccd93"},
    "downloading": {"title": "Direct Downloads", "icon": "download", "color": "#BEC23F"},
    "torrenting": {"title": "Torrenting", "icon": "magnet", "color": "#8A6BBE"},
    "educational": {"title": "Educational Resources", "icon": "graduation-cap", "color": "#A8D8B9"},
    "mobile": {"title": "Mobile (Android/iOS)", "icon": "smartphone", "color": "#DAC9A6"},
    "linux-macos": {"title": "Linux & macOS", "icon": "terminal", "color": "#f17c67"},
    "non-english": {"title": "Non-English", "icon": "languages", "color": "#FB9966"},
    "misc": {"title": "Miscellaneous", "icon": "archive", "color": "#DDD23B"},
    
    # Tools files
    "developer-tools": {"title": "Developer Tools", "icon": "code", "color": "#61afef"},
    "file-tools": {"title": "File Tools", "icon": "file", "color": "#98c379"},
    "gaming-tools": {"title": "Gaming Tools", "icon": "activity", "color": "#e5c07b"},
    "image-tools": {"title": "Image Tools", "icon": "image", "color": "#d19a66"},
    "internet-tools": {"title": "Internet Tools", "icon": "globe", "color": "#e06c75"},
    "social-media-tools": {"title": "Social Media Tools", "icon": "share-2", "color": "#c678dd"},
    "system-tools": {"title": "System Tools", "icon": "settings", "color": "#56b6c2"},
    "text-tools": {"title": "Text Tools", "icon": "align-left", "color": "#abb2bf"},
    "video-tools": {"title": "Video Tools", "icon": "video", "color": "#4ae3d9"},
    "storage": {"title": "Cloud & Storage", "icon": "database", "color": "#e8a87c"},
    "unsafe": {"title": "Unsafe / Avoid", "icon": "alert-triangle", "color": "#f07178"},
    "feedback": {"title": "Feedback & Guides", "icon": "message-square", "color": "#c792ea"}
}

def strip_markdown(text):
    if not text:
        return ""
    # Strip asterisks bold/italics
    text = text.replace("**", "").replace("*", "")
    # Strip underscores bold/italics
    text = text.replace("__", "").replace("_", "")
    # Strip backticks
    text = text.replace("`", "")
    return text.strip()

def clean_html_entities(text):
    if not text:
        return ""
    text = text.replace('&quot;', '"').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    text = text.replace('&#39;', "'").replace('&nbsp;', ' ')
    return text.strip()

def fetch_meta_description(url):
    if not url.startswith("http"):
        return "<nil>"
    
    # Try fetching
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
        )
        with urllib.request.urlopen(req, timeout=3.0) as response:
            html = response.read()
            try:
                html_text = html.decode('utf-8', errors='ignore')
            except Exception:
                html_text = html.decode('latin-1', errors='ignore')
                
            # Search for meta description
            desc_match = re.search(r'<meta\s+[^>]*name=["\']description["\']\s+[^>]*content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
            if not desc_match:
                desc_match = re.search(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*name=["\']description["\']', html_text, re.IGNORECASE)
            if not desc_match:
                desc_match = re.search(r'<meta\s+[^>]*property=["\']og:description["\']\s+[^>]*content=["\']([^"\']+)["\']', html_text, re.IGNORECASE)
            if not desc_match:
                desc_match = re.search(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*property=["\']og:description["\']', html_text, re.IGNORECASE)
                
            if desc_match:
                return clean_html_entities(desc_match.group(1).strip())
                
            # Fallback to <title>
            title_match = re.search(r'<title>([^<]+)</title>', html_text, re.IGNORECASE)
            if title_match:
                title = clean_html_entities(title_match.group(1).strip())
                # If title is just a placeholder, don't use it
                if len(title) > 3 and not any(x in title.lower() for x in ["access denied", "404", "not found"]):
                    return title
                    
    except Exception:
        pass
    return "<nil>"

def parse_list_item(line):
    # Detect features
    starred = "⭐" in line
    # Remove list bullet and clean up start
    cleaned_line = re.sub(r'^\s*[\*\-\+]\s*', '', line).strip()
    cleaned_line = cleaned_line.replace("⭐", "").replace("↪️", "").replace("🌐", "").strip()
    
    # Find all markdown links in this line
    links_matches = list(re.finditer(r'\[([^\]]+)\]\(([^)]+)\)', cleaned_line))
    if not links_matches:
        return {"type": "text", "content": strip_markdown(line)}
    
    # Separate bold links (enclosed in double asterisks, or containing asterisks inside name)
    bold_links_matches = list(re.finditer(r'\*\*\[([^\]]+)\]\(([^)]+)\)\*\*', cleaned_line))
    # Or links that have asterisks inside brackets: [**Name**](url)
    inner_bold_links_matches = list(re.finditer(r'\[\*\*([^\*]+)\*\*\]\(([^)]+)\)', cleaned_line))
    
    main_links = []
    if bold_links_matches:
        for m in bold_links_matches:
            main_links.append({"name": strip_markdown(m.group(1)), "url": m.group(2).strip()})
    elif inner_bold_links_matches:
        for m in inner_bold_links_matches:
            main_links.append({"name": strip_markdown(m.group(1)), "url": m.group(2).strip()})
    else:
        # Take first link as main
        first_match = links_matches[0]
        # Check if name has asterisks inside it, clean it
        name_clean = strip_markdown(first_match.group(1))
        main_links.append({"name": name_clean, "url": first_match.group(2).strip()})
    
    # Auxiliary links
    auxiliary_links = []
    main_urls = {link["url"] for link in main_links}
    for m in links_matches:
        name = strip_markdown(m.group(1))
        url = m.group(2).strip()
        if url not in main_urls:
            auxiliary_links.append({"name": name, "url": url})
            
    # Formulate description text
    desc_text = cleaned_line
    for m in bold_links_matches:
        desc_text = desc_text.replace(m.group(0), "")
    for m in inner_bold_links_matches:
        desc_text = desc_text.replace(m.group(0), "")
    if not bold_links_matches and not inner_bold_links_matches:
        desc_text = desc_text.replace(links_matches[0].group(0), "")
        
    for m in links_matches:
        url = m.group(2).strip()
        if url not in main_urls:
            desc_text = desc_text.replace(m.group(0), "")
            
    # Clean up delimiters and strip markdown bold/italics
    desc_text = re.sub(r'^\s*[\-\/,\:\.]\s*', '', desc_text)
    desc_text = re.sub(r'\s*[\-\/,\:\.]\s*$', '', desc_text)
    desc_text = re.sub(r'\s*/\s*/\s*', ' / ', desc_text)
    desc_text = strip_markdown(desc_text)
    desc_text = re.sub(r'\s+', ' ', desc_text)
    
    return {
        "type": "resource",
        "starred": starred,
        "links": main_links,
        "description": desc_text,
        "auxiliary": auxiliary_links
    }

def parse_md_file(filepath, filename_clean):
    category_info = CATEGORY_MAP.get(filename_clean, {
        "title": filename_clean.replace("-", " ").title(),
        "icon": "help-circle",
        "color": "#9e9e9e"
    })
    
    category = {
        "id": filename_clean,
        "title": category_info["title"],
        "icon": category_info["icon"],
        "color": category_info["color"],
        "sections": []
    }
    
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    current_section = None
    
    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue
            
        if "Back to Wiki Index" in line_str or "Back to index" in line_str:
            continue
            
        header_match = re.match(r'^(#{1,4})\s+(.*)', line_str)
        if header_match:
            level = len(header_match.group(1))
            title = header_match.group(2).strip()
            title = re.sub(r'^[►▷▽◁◄\s\d\.\-\>]+', '', title).strip()
            title = strip_markdown(title)
            
            if level == 1 and ("index" in title.lower() or "back" in title.lower()):
                continue
                
            current_section = {
                "title": title,
                "items": []
            }
            category["sections"].append(current_section)
            continue
            
        if current_section is None:
            current_section = {
                "title": "General",
                "items": []
            }
            category["sections"].append(current_section)
            
        if line_str.startswith(">"):
            quote_text = line_str.lstrip("> ").strip()
            quote_text = strip_markdown(quote_text)
            if current_section["items"] and current_section["items"][-1]["type"] == "blockquote":
                current_section["items"][-1]["content"] += "\n" + quote_text
            else:
                current_section["items"].append({
                    "type": "blockquote",
                    "content": quote_text
                })
        elif line_str.startswith("!!!"):
            alert_text = re.sub(r'^!!!\w*\s*', '', line_str).strip()
            alert_text = strip_markdown(alert_text)
            current_section["items"].append({
                "type": "alert",
                "content": alert_text
            })
        elif re.match(r'^\s*[\*\-\+]\s*', line_str):
            parsed_item = parse_list_item(line_str)
            current_section["items"].append(parsed_item)
        elif line_str == "***" or line_str == "---":
            continue
        else:
            line_clean = strip_markdown(line_str)
            if current_section["items"] and current_section["items"][-1]["type"] == "text":
                current_section["items"][-1]["content"] += " " + line_clean
            else:
                current_section["items"].append({
                    "type": "text",
                    "content": line_clean
                })
                
    category["sections"] = [s for s in category["sections"] if s["items"]]
    return category

def main():
    # 1. Load Cache
    cache = {}
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                cache = json.load(f)
            print(f"Loaded {len(cache)} cached URL descriptions.")
        except Exception:
            print("Could not load descriptions cache. Starting fresh.")
            
    all_categories = []
    priority_order = [
        "beginners-guide", "privacy", "ai", "video", "audio", "gaming", "reading",
        "downloading", "torrenting", "educational", "mobile", "linux-macos",
        "non-english", "misc"
    ]
    
    files_in_dir = os.listdir(SOURCE_DIR)
    markdown_files = [f for f in files_in_dir if f.endswith(".md") and f != "index.md"]
    
    def get_sort_key(filename):
        name = filename[:-3]
        if name in priority_order:
            return (0, priority_order.index(name))
        elif name in CATEGORY_MAP:
            return (1, name)
        else:
            return (2, name)
            
    markdown_files.sort(key=get_sort_key)
    
    # Parse all documents
    for filename in markdown_files:
        clean_name = filename[:-3]
        filepath = os.path.join(SOURCE_DIR, filename)
        if clean_name in ["sandbox", "posts", "startpage"] or os.path.getsize(filepath) < 500:
            continue
            
        print(f"Parsing {filename}...")
        try:
            category_data = parse_md_file(filepath, clean_name)
            if category_data["sections"]:
                all_categories.append(category_data)
        except Exception as e:
            print(f"Error parsing {filename}: {e}")
            
    # 2. Gather links that need scraping
    urls_to_scrape = {}
    for cat in all_categories:
        for sec in cat["sections"]:
            for item in sec["items"]:
                if item["type"] == "resource":
                    # If description is empty or missing, try scraping
                    if not item["description"].strip():
                        # Use the first main link
                        url = item["links"][0]["url"]
                        if url.startswith("http") and url not in cache:
                            urls_to_scrape[url] = item
                            
    # 3. Scraping links concurrently using ThreadPool
    if urls_to_scrape:
        print(f"Found {len(urls_to_scrape)} links missing descriptions. Starting crawler...")
        
        # Limit to crawl a maximum of 100 links per run to keep times reasonable
        # Users can rerun compile to crawl more.
        max_crawl = min(150, len(urls_to_scrape))
        crawl_urls = list(urls_to_scrape.keys())[:max_crawl]
        
        print(f"Crawling first {max_crawl} uncached URLs using 30 threads...")
        
        crawled_results = {}
        with ThreadPoolExecutor(max_workers=30) as executor:
            future_to_url = {executor.submit(fetch_meta_description, url): url for url in crawl_urls}
            
            completed_count = 0
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    desc = future.result()
                    crawled_results[url] = desc
                except Exception:
                    crawled_results[url] = "<nil>"
                
                completed_count += 1
                if completed_count % 30 == 0:
                    print(f"Crawled {completed_count}/{max_crawl}...")
                    
        # Update cache with new results
        cache.update(crawled_results)
        
        # Save cache
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(cache, f, indent=2, ensure_ascii=False)
            print("Saved updated descriptions cache.")
        except Exception as e:
            print(f"Could not save cache: {e}")
            
    # 4. Apply description fallbacks
    for cat in all_categories:
        for sec in cat["sections"]:
            for item in sec["items"]:
                if item["type"] == "resource":
                    if not item["description"].strip():
                        url = item["links"][0]["url"]
                        # Get from cache or set as <nil>
                        item["description"] = cache.get(url, "<nil>")

    # 5. Output javascript file
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("/* AUTO-GENERATED DATA FILE FROM MARKDOWN SOURCES */\n")
        out.write("window.RESOURCES_DATA = ")
        json.dump({"categories": all_categories}, out, indent=2, ensure_ascii=False)
        out.write(";\n")
        
    print(f"Successfully generated {OUTPUT_FILE} with {len(all_categories)} categories.")

if __name__ == "__main__":
    main()
