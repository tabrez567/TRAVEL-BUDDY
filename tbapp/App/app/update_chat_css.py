
import os

file_path = r'c:\Users\TABRE\OneDrive\Desktop\app\static\css\chat.css'

new_css = """.chat-welcome {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 40px;
    background: var(--bg-secondary, #f9fafb);
    position: relative;
    overflow: hidden;
}

[data-theme="dark"] .chat-welcome {
    background: var(--bg-secondary, #1e293b);
}

.empty-state-content {
    text-align: center;
    max-width: 400px;
}

.empty-state-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #667eea;
}

.chat-welcome h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary, #111827);
    margin-bottom: 12px;
}

[data-theme="dark"] .chat-welcome h2 {
    color: var(--text-primary, #f1f5f9);
}

.chat-welcome p {
    font-size: 1rem;
    color: var(--text-secondary, #6b7280);
    margin-bottom: 32px;
    line-height: 1.5;
}

[data-theme="dark"] .chat-welcome p {
    color: var(--text-secondary, #94a3b8);
}

.empty-state-actions {
    display: flex;
    justify-content: center;
    gap: 16px;
}
"""

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Lines are 0-indexed in python list, but 1-indexed in my notes
# Replace 549-563 (indices 548-563)
# Remove 565-752 (indices 564-752)

# First, remove the hero section (indices 564 to 752)
# We do this first to avoid index shifting issues if we were inserting
# But here we are replacing a block before it, so it's safer to just rebuild the list

# Keep lines before 549 (0 to 548)
new_lines = lines[:548]

# Add new CSS
new_lines.append(new_css)

# Skip the old chat-welcome block (549-563) -> indices 548-563
# Skip the hero section (565-752) -> indices 564-752
# So we want to resume from line 753 (index 752)

# Check if there was a gap between 563 and 565.
# Line 564 was empty in the file view.
# So we skip from 548 to 752.

new_lines.extend(lines[752:])

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Successfully updated chat.css")
