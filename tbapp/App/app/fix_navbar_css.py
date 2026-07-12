
import os

file_path = r'c:\Users\TABRE\OneDrive\Desktop\app\static\css\navbar.css'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to remove the specific styling for the messages nav item
# It starts around line 133 and ends around line 190 based on the view_file output
# I'll look for the start and end markers in the content

start_marker = "/* Messages Navigation Item - Custom Color */"
# The block seems to end before the .nav-link i rule at line 192
# I'll iterate and find the lines to remove

new_lines = []
skip = False
for line in lines:
    if start_marker in line:
        skip = True
    
    if skip and ".nav-link i {" in line and "margin-bottom" in lines[lines.index(line)+1]:
        # This looks like the start of the next block
        skip = False
    
    if not skip:
        new_lines.append(line)

# Wait, the logic above is a bit risky if I don't catch the end correctly.
# Let's be more precise. The block I want to remove is:
# 133: .nav-item:has(a[href*="chat"]) .nav-link,
# ...
# 190: }

# Actually, I can just replace the specific selectors with empty strings or remove the lines.
# But let's try to identify the range more accurately.
# The block starts with "/* Messages Navigation Item - Custom Color */"
# And ends before ".nav-link i {" (line 192 in the view)

# Let's just filter out the lines that contain the specific selectors or are within that block.
# A safer way is to read the file, find the start index, find the end index, and slice.

start_index = -1
end_index = -1

for i, line in enumerate(lines):
    if "/* Messages Navigation Item - Custom Color */" in line:
        start_index = i
    if start_index != -1 and ".nav-link i {" in line:
        end_index = i
        break

if start_index != -1 and end_index != -1:
    # We keep everything before start_index and everything from end_index onwards
    final_lines = lines[:start_index] + lines[end_index:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(final_lines)
    print("Successfully removed custom messages styling from navbar.css")
else:
    print("Could not find the target block in navbar.css")

