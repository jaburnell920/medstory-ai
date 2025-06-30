#!/usr/bin/env python3

import os
import subprocess
from PIL import Image
import xml.etree.ElementTree as ET

def png_to_svg_potrace(png_path, svg_path):
    """Convert PNG to SVG using potrace"""
    # First convert PNG to PBM (bitmap format that potrace can read)
    pbm_path = png_path.replace('.png', '.pbm')
    
    # Convert PNG to PBM using ImageMagick
    subprocess.run(['convert', png_path, '-threshold', '50%', pbm_path], check=True)
    
    # Convert PBM to SVG using potrace
    subprocess.run(['potrace', '-s', '-o', svg_path, pbm_path], check=True)
    
    # Clean up temporary PBM file
    os.remove(pbm_path)

def modify_svg_colors(svg_path, output_path, main_color, bg_color):
    """Modify SVG colors and add background"""
    # Parse the SVG
    tree = ET.parse(svg_path)
    root = tree.getroot()
    
    # Get SVG dimensions
    width = root.get('width', '100')
    height = root.get('height', '100')
    viewbox = root.get('viewBox', f'0 0 {width} {height}')
    
    # Create new SVG with background
    new_svg = ET.Element('svg')
    new_svg.set('xmlns', 'http://www.w3.org/2000/svg')
    new_svg.set('width', width)
    new_svg.set('height', height)
    new_svg.set('viewBox', viewbox)
    
    # Add background rectangle
    bg_rect = ET.SubElement(new_svg, 'rect')
    bg_rect.set('width', '100%')
    bg_rect.set('height', '100%')
    bg_rect.set('fill', bg_color)
    
    # Copy all paths from original SVG and change their color
    for path in root.findall('.//{http://www.w3.org/2000/svg}path'):
        new_path = ET.SubElement(new_svg, 'path')
        new_path.set('d', path.get('d', ''))
        new_path.set('fill', main_color)
        new_path.set('stroke', 'none')
    
    # Handle other elements like circles, rects, etc.
    for elem in root.iter():
        if elem.tag.endswith('}path'):
            continue  # Already handled above
        elif elem.tag.endswith('}g'):
            new_g = ET.SubElement(new_svg, 'g')
            for attr, value in elem.attrib.items():
                new_g.set(attr, value)
        elif elem.tag.endswith('}circle'):
            new_circle = ET.SubElement(new_svg, 'circle')
            for attr, value in elem.attrib.items():
                if attr == 'fill':
                    new_circle.set(attr, main_color)
                else:
                    new_circle.set(attr, value)
        elif elem.tag.endswith('}rect') and elem != root:
            new_rect = ET.SubElement(new_svg, 'rect')
            for attr, value in elem.attrib.items():
                if attr == 'fill':
                    new_rect.set(attr, main_color)
                else:
                    new_rect.set(attr, value)
    
    # Write the new SVG
    tree = ET.ElementTree(new_svg)
    tree.write(output_path, encoding='unicode', xml_declaration=True)

def create_simple_svg(png_path, output_path, main_color, bg_color):
    """Create a simple SVG representation of the PNG"""
    # Get image dimensions
    with Image.open(png_path) as img:
        width, height = img.size
    
    # Create a simple SVG template
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100%" height="100%" fill="{bg_color}"/>
    <circle cx="50" cy="50" r="30" fill="{main_color}"/>
    <circle cx="40" cy="40" r="8" fill="{bg_color}"/>
    <circle cx="60" cy="40" r="8" fill="{bg_color}"/>
    <path d="M 35 65 Q 50 75 65 65" stroke="{bg_color}" stroke-width="3" fill="none"/>
</svg>'''
    
    with open(output_path, 'w') as f:
        f.write(svg_content)

def main():
    icons_dir = '/workspace/medstory-ai/public/icons'
    public_dir = '/workspace/medstory-ai/public'
    
    # Define the icon mappings
    icon_files = [
        'core_story_concept.png',
        'medstory_slide_deck.png', 
        'scientific_investigation.png',
        'stakeholder_interviews.png',
        'story_flow_map.png'
    ]
    
    # Colors for the two versions
    menu_main_color = '#14326D'  # Blue color matching existing SVGs
    menu_bg_color = '#002F6C'    # Sidebar background color
    
    chat_main_color = '#063471'  # Specified blue color
    chat_bg_color = '#FFFFFF'    # White background
    
    for icon_file in icon_files:
        png_path = os.path.join(icons_dir, icon_file)
        base_name = icon_file.replace('.png', '')
        
        print(f"Processing {icon_file}...")
        
        # Create menu version (for sidebar)
        menu_svg_path = os.path.join(public_dir, f'{base_name}_menu.svg')
        
        # Create chat version (for conversational pages)  
        chat_svg_path = os.path.join(public_dir, f'{base_name}_chat.svg')
        
        try:
            # Try using potrace first
            temp_svg = os.path.join(public_dir, f'{base_name}_temp.svg')
            png_to_svg_potrace(png_path, temp_svg)
            
            # Create menu version
            modify_svg_colors(temp_svg, menu_svg_path, menu_main_color, menu_bg_color)
            
            # Create chat version
            modify_svg_colors(temp_svg, chat_svg_path, chat_main_color, chat_bg_color)
            
            # Clean up temp file
            os.remove(temp_svg)
            
        except Exception as e:
            print(f"Potrace failed for {icon_file}, creating simple SVG: {e}")
            # Fallback to simple SVG creation
            create_simple_svg(png_path, menu_svg_path, menu_main_color, menu_bg_color)
            create_simple_svg(png_path, chat_svg_path, chat_main_color, chat_bg_color)
        
        print(f"Created {menu_svg_path} and {chat_svg_path}")

if __name__ == '__main__':
    main()