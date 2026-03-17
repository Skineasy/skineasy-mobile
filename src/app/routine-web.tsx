/**
 * Web-only Routine Results Page (for iframe embedding)
 *
 * URL: /routine-web?rspid=xxx
 *
 * This page has no header/navigation - designed to be embedded in an iframe
 * on the PHP website at skineasy.com/fr/my-custom-page-mobile
 */
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Text, View } from 'react-native';

import { RoutineWebContent } from '@features/routine/components/RoutineWebContent';

// Toggle this to test iframe resize
const __DEV_TEST_RESIZE__ = false;

function getRspidFromUrl(): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('rspid');
  }
  return null;
}

export default function RoutineWebPage() {
  const { i18n } = useTranslation();
  const rspid = useMemo(() => getRspidFromUrl(), []);

  // Force French locale on web
  useEffect(() => {
    if (i18n.language !== 'fr') {
      i18n.changeLanguage('fr');
    }
  }, [i18n]);

  // Send height to parent iframe for proper resizing
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const sendHeight = () => {
      const container = document.getElementById('routine-content');
      if (!container) return;

      // Get the bounding rect of all children and calculate total height
      const children = container.querySelectorAll('*');
      let maxBottom = 0;
      children.forEach((child) => {
        const rect = child.getBoundingClientRect();
        const bottom = rect.bottom + window.scrollY;
        if (bottom > maxBottom) maxBottom = bottom;
      });

      // Add some padding
      const height = Math.ceil(maxBottom) + 20;
      window.parent.postMessage({ type: 'resize', height }, '*');
    };

    // Delay initial measurement to let React render
    const timeout = setTimeout(sendHeight, 200);

    // Also send on interval for first few seconds (content may load async)
    const interval = setInterval(sendHeight, 500);
    setTimeout(() => clearInterval(interval), 5000);

    // Re-send when content changes
    const observer = new MutationObserver(sendHeight);
    const target = document.getElementById('routine-content') || document.body;
    observer.observe(target, { childList: true, subtree: true });

    // Also observe resize
    const resizeObserver = new ResizeObserver(sendHeight);
    resizeObserver.observe(target);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, []);

  // Test mode: cycle through different heights
  const [boxCount, setBoxCount] = useState(1);
  useEffect(() => {
    if (!__DEV_TEST_RESIZE__ || Platform.OS !== 'web') return;
    const interval = setInterval(() => {
      setBoxCount((c) => (c >= 5 ? 1 : c + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (__DEV_TEST_RESIZE__) {
    return (
      <View nativeID="routine-content" className="bg-white p-4">
        <Text className="text-xl font-bold text-text mb-4">
          Test iframe resize - {boxCount} box(es)
        </Text>
        {Array.from({ length: boxCount }).map((_, i) => (
          <View key={i} className="bg-primary/20 rounded-lg p-6 mb-4">
            <Text className="text-lg text-text">Box {i + 1}</Text>
            <Text className="text-textMuted">
              This content changes every 2 seconds to test iframe auto-resize
            </Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View nativeID="routine-content" className="bg-white">
      <RoutineWebContent rspid={rspid} />
    </View>
  );
}
