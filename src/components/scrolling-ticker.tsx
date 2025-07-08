
"use client";

import { Flame } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Tournament } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export function ScrollingTicker() {
  const [tickerItems, setTickerItems] = useState<string[]>([]);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const q = query(collection(db, "tournaments"), where("status", "==", "Upcoming"));
        const querySnapshot = await getDocs(q);
        const tournaments = querySnapshot.docs.map(doc => doc.data() as Tournament);
        const items = tournaments.map(t => `🏆 ${t.title} - Prize Pool: ₹${t.prizePool.toLocaleString()}`);
        setTickerItems(items);
      } catch (error) {
        console.error("Failed to fetch ticker data:", error);
      }
    };
    fetchTickerData();
  }, []);

  if (tickerItems.length === 0) {
    return null; // Don't render anything if there's no data
  }
  
  // Duplicate for seamless loop
  const extendedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="w-full overflow-hidden bg-primary/10 backdrop-blur-sm border-t-2 border-primary py-2">
      <div className="flex animate-ticker whitespace-nowrap">
        {extendedItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <span className="mx-8 text-sm font-bold uppercase tracking-wider text-primary">
              {item}
            </span>
            <Flame className="h-4 w-4 text-accent" />
          </div>
        ))}
      </div>
    </div>
  );
}
