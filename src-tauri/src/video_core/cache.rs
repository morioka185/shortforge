use std::collections::HashMap;

pub struct LruFrameCache {
    cache: HashMap<u64, Vec<u8>>,
    order: Vec<u64>,
    capacity: usize,
}

impl LruFrameCache {
    pub fn new(capacity: usize) -> Self {
        Self {
            cache: HashMap::with_capacity(capacity),
            order: Vec::with_capacity(capacity),
            capacity,
        }
    }

    pub fn get(&mut self, pts_ms: u64) -> Option<&Vec<u8>> {
        if self.cache.contains_key(&pts_ms) {
            // Move to end (most recently used)
            self.order.retain(|&k| k != pts_ms);
            self.order.push(pts_ms);
            self.cache.get(&pts_ms)
        } else {
            None
        }
    }

    pub fn put(&mut self, pts_ms: u64, data: Vec<u8>) {
        if self.cache.contains_key(&pts_ms) {
            self.order.retain(|&k| k != pts_ms);
        } else if self.cache.len() >= self.capacity {
            // Evict least recently used
            if let Some(oldest) = self.order.first().copied() {
                self.order.remove(0);
                self.cache.remove(&oldest);
            }
        }

        self.order.push(pts_ms);
        self.cache.insert(pts_ms, data);
    }

    pub fn clear(&mut self) {
        self.cache.clear();
        self.order.clear();
    }

    pub fn len(&self) -> usize {
        self.cache.len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_lru_cache_basic() {
        let mut cache = LruFrameCache::new(3);

        cache.put(100, vec![1, 2, 3]);
        cache.put(200, vec![4, 5, 6]);
        cache.put(300, vec![7, 8, 9]);

        assert_eq!(cache.len(), 3);
        assert_eq!(cache.get(100), Some(&vec![1, 2, 3]));
    }

    #[test]
    fn test_lru_cache_eviction() {
        let mut cache = LruFrameCache::new(2);

        cache.put(100, vec![1]);
        cache.put(200, vec![2]);
        cache.put(300, vec![3]); // Should evict 100

        assert!(cache.get(100).is_none());
        assert_eq!(cache.get(200), Some(&vec![2]));
        assert_eq!(cache.get(300), Some(&vec![3]));
    }

    #[test]
    fn test_lru_cache_access_updates_order() {
        let mut cache = LruFrameCache::new(2);

        cache.put(100, vec![1]);
        cache.put(200, vec![2]);

        // Access 100 to make it more recent
        cache.get(100);

        cache.put(300, vec![3]); // Should evict 200 (least recently used)

        assert_eq!(cache.get(100), Some(&vec![1]));
        assert!(cache.get(200).is_none());
        assert_eq!(cache.get(300), Some(&vec![3]));
    }
}
