
import os

file_path = r'c:\Users\TABRE\OneDrive\Desktop\app\static\css\chat.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace sidebar header background
old_header_bg = "background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);"
new_header_bg = "background: var(--bg-primary, #ffffff);"
content = content.replace(old_header_bg, new_header_bg)

# Replace header text gradient
old_text_gradient = """    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;"""
new_text_color = "    color: var(--text-primary, #111827);"
content = content.replace(old_text_gradient, new_text_color)

# Adjust font size and weight
content = content.replace("font-size: 1.5rem;", "font-size: 1.25rem;")
content = content.replace("font-weight: 700;", "font-weight: 600;")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated sidebar CSS")
