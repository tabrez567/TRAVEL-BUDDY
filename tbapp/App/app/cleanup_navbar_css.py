
import os

file_path = r'c:\Users\TABRE\OneDrive\Desktop\app\static\css\navbar.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove lines that contain specific selectors related to messages-active
# or :has(a[href*="chat"])

new_lines = []
skip = False
for line in lines:
    if ".nav-item.messages-active .nav-link i {" in line:
        skip = True
    
    if skip and "}" in line:
        skip = False
        continue # Skip the closing brace too
    
    if not skip:
        # Check for other blocks
        if ".nav-item:has(a[href*=\"chat\"])" in line or ".nav-item.messages-active" in line:
             # This is a single line selector or start of block
             if "{" in line:
                 skip = True
             else:
                 # It might be a multi-line selector, let's just skip this line
                 continue
        else:
            new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully cleaned up navbar.css")
