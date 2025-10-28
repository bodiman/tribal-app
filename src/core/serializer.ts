import type { Graph } from './schema';
import { validateGraph } from './schema';

export class GraphSerializer {
  static toJSON(graph: Graph): string {
    return JSON.stringify(graph, null, 2);
  }

  static fromJSON(json: string): Graph {
    try {
      const data = JSON.parse(json);
      return validateGraph(data);
    } catch (error) {
      throw new Error(`Invalid graph JSON: ${error}`);
    }
  }

  static saveToFile(graph: Graph, filename: string) {
    const json = this.toJSON(graph);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async loadFromFile(file: File): Promise<Graph> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const graph = this.fromJSON(content);
          resolve(graph);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

// IndexedDB persistence
export class GraphPersistence {
  private dbName = 'TribalGraphs';
  private version = 1;
  private storeName = 'graphs';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveGraph(id: string, graph: Graph): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.put({
      id,
      graph,
      timestamp: Date.now(),
    });
  }

  async loadGraph(id: string): Promise<Graph | null> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.graph : null);
      };
    });
  }

  async listGraphs(): Promise<Array<{ id: string; timestamp: number }>> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result.map(item => ({
          id: item.id,
          timestamp: item.timestamp,
        }));
        resolve(results);
      };
    });
  }

  async deleteGraph(id: string): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    
    await store.delete(id);
  }
}