#!/usr/bin/env python3
"""
Script to update blocks.json with correct texture URLs by matching block names
to available texture files from files.txt
"""

import json
import re
from typing import List, Dict, Set

def load_available_textures(files_txt_path: str) -> Set[str]:
    """Load the list of available texture files from files.txt"""
    with open(files_txt_path, 'r', encoding='utf-8') as f:
        textures = {line.strip() for line in f if line.strip().endswith('.png')}
    return textures

def normalize_name(name: str) -> str:
    """Normalize a block name for matching"""
    return name.lower().replace('_', '').replace('-', '').replace(' ', '')

def find_matching_texture(block_name: str, available_textures: Set[str]) -> str:
    """
    Find the best matching texture for a given block name.
    Returns the texture filename or 'missing_texture.png' if no match found.
    """
    block_name = block_name.lower()
    
    # Try exact match first
    exact_match = f"{block_name}.png"
    if exact_match in available_textures:
        return exact_match
    
    # Try variations with common prefixes
    variations = [
        f"stone_{block_name}.png",
        f"planks_{block_name}.png",
        f"log_{block_name}.png",
        f"leaves_{block_name}.png",
        f"wool_colored_{block_name}.png",
        f"glass_{block_name}.png",
        f"concrete_{block_name}.png",
        f"hardened_clay_stained_{block_name}.png",
        f"glazed_terracotta_{block_name}.png"
    ]
    
    for variation in variations:
        if variation in available_textures:
            return variation
    
    # Special cases for compound names
    if 'polished' in block_name:
        base_name = block_name.replace('polished_', '')
        smooth_variations = [
            f"stone_{base_name}_smooth.png",
            f"{base_name}_smooth.png",
            f"polished_{base_name}.png"
        ]
        for variation in smooth_variations:
            if variation in available_textures:
                return variation
    
    # Try removing prefixes and suffixes
    name_parts = block_name.split('_')
    if len(name_parts) > 1:
        # Try combinations of parts
        for i in range(len(name_parts)):
            for j in range(i + 1, len(name_parts) + 1):
                part_combo = '_'.join(name_parts[i:j])
                test_variations = [
                    f"{part_combo}.png",
                    f"stone_{part_combo}.png",
                    f"planks_{part_combo}.png"
                ]
                for variation in test_variations:
                    if variation in available_textures:
                        return variation
    
    # Try fuzzy matching - find textures that contain any part of the block name
    normalized_block = normalize_name(block_name)
    best_matches = []
    
    for texture in available_textures:
        texture_base = texture.replace('.png', '')
        normalized_texture = normalize_name(texture_base)
        
        # Check if any part of the block name is in the texture name
        block_parts = normalized_block.split('_') if '_' in block_name else [normalized_block]
        for part in block_parts:
            if len(part) > 2 and part in normalized_texture:
                best_matches.append(texture)
                break
    
    # If we found matches, prefer the shortest one (usually more specific)
    if best_matches:
        return min(best_matches, key=len)
    
    # No match found
    return "missing_texture.png"

def update_blocks_json(blocks_json_path: str, files_txt_path: str) -> Dict[str, int]:
    """
    Update the blocks.json file with correct texture URLs.
    Returns statistics about the updates.
    """
    # Load available textures
    available_textures = load_available_textures(files_txt_path)
    print(f"Loaded {len(available_textures)} available textures")
    
    # Load blocks.json
    with open(blocks_json_path, 'r', encoding='utf-8') as f:
        blocks_data = json.load(f)
    
    print(f"Loaded {len(blocks_data)} blocks from JSON")
    
    # Statistics
    stats = {
        'total_processed': 0,
        'missing_found': 0,
        'updated': 0,
        'still_missing': 0
    }
    
    # Process each block
    for block in blocks_data:
        stats['total_processed'] += 1
        
        if block.get('url') == 'blocks/missing_texture.png':
            stats['missing_found'] += 1
            block_name = block.get('name', '')
            
            # Find matching texture
            matching_texture = find_matching_texture(block_name, available_textures)
            
            if matching_texture != 'missing_texture.png':
                old_url = block['url']
                new_url = f"blocks/{matching_texture}"
                block['url'] = new_url
                stats['updated'] += 1
                print(f"Updated '{block_name}': {old_url} -> {new_url}")
            else:
                stats['still_missing'] += 1
                print(f"No match found for '{block_name}'")
    
    # Save updated JSON
    with open(blocks_json_path, 'w', encoding='utf-8') as f:
        json.dump(blocks_data, f, indent=2, ensure_ascii=False)
    
    return stats

def main():
    """Main function to execute the texture update process"""
    blocks_json_path = "blocks.json"
    files_txt_path = "files.txt"
    
    print("Starting texture update process...")
    print(f"Blocks file: {blocks_json_path}")
    print(f"Textures file: {files_txt_path}")
    print("-" * 50)
    
    try:
        stats = update_blocks_json(blocks_json_path, files_txt_path)
        
        print("-" * 50)
        print("Update completed successfully!")
        print(f"Total blocks processed: {stats['total_processed']}")
        print(f"Blocks with missing textures found: {stats['missing_found']}")
        print(f"Blocks successfully updated: {stats['updated']}")
        print(f"Blocks still missing textures: {stats['still_missing']}")
        
        if stats['updated'] > 0:
            success_rate = (stats['updated'] / stats['missing_found']) * 100
            print(f"Success rate: {success_rate:.1f}%")
        
    except FileNotFoundError as e:
        print(f"Error: Could not find file - {e}")
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format - {e}")
    except Exception as e:
        print(f"Error: An unexpected error occurred - {e}")

if __name__ == "__main__":
    main()