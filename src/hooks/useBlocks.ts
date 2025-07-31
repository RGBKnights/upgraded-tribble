import { useState, useEffect } from 'react';
import { Block } from '../types/Block';

export const useBlocks = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBlocks, setFilteredBlocks] = useState<Block[]>([]);

  // Load blocks from assets/blocks.json on component mount
  useEffect(() => {
    const loadBlocksFromAssets = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.BASE_URL || '/'}blocks.json`);
        if (!response.ok) {
          throw new Error(`Failed to load blocks.json: ${response.statusText}`);
        }
        const rawBlocks: Block[] = await response.json();
        
        // Transform URLs to be absolute paths
        const blocksWithAbsoluteUrls = rawBlocks.map(block => ({
          ...block,
          url: block.url.startsWith('http') ? block.url : `/${block.url}`
        }));
        
        setBlocks(blocksWithAbsoluteUrls);
        setError(null);
      } catch (err) {
        console.error('Error loading blocks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load blocks');
        // Fallback to empty array if loading fails
        setBlocks([]);
      } finally {
        setLoading(false);
      }
    };

    loadBlocksFromAssets();
  }, []);

  useEffect(() => {
    const filtered = blocks.filter(block => 
      !block.url.includes('missing_texture.png') &&
      (block.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      block.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredBlocks(filtered);
  }, [blocks, searchTerm]);

  const loadBlocksFromJson = (jsonData: Block[]) => {
    // Transform URLs to be absolute paths when loading custom JSON
    const blocksWithAbsoluteUrls = jsonData.map(block => ({
      ...block,
      url: block.url.startsWith('http') ? block.url : `/${block.url}`
    }));
    setBlocks(blocksWithAbsoluteUrls);
  };

  const getBlockById = (id: number): Block | undefined => {
    return blocks.find(block => block.id === id);
  };

  return {
    blocks,
    filteredBlocks,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    loadBlocksFromJson,
    getBlockById
  };
};