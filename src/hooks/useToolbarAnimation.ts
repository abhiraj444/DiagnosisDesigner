import { useEffect, useState } from 'react';

type AnimationState = 'entering' | 'entered' | 'exiting' | 'exited';

interface UseToolbarAnimationProps {
  isVisible: boolean;
  duration?: number;
}

export function useToolbarAnimation({ isVisible, duration = 300 }: UseToolbarAnimationProps) {
  const [animationState, setAnimationState] = useState<AnimationState>('exited');
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Show the toolbar
      setShouldRender(true);
      setAnimationState('entering');
      
      // Trigger the animation after a brief delay to ensure element is rendered
      const enterTimer = setTimeout(() => {
        setAnimationState('entered');
      }, 10);

      return () => clearTimeout(enterTimer);
    } else {
      // Hide the toolbar
      setAnimationState('exiting');
      
      // Remove from DOM after animation completes
      const exitTimer = setTimeout(() => {
        setAnimationState('exited');
        setShouldRender(false);
      }, duration);

      return () => clearTimeout(exitTimer);
    }
  }, [isVisible, duration]);

  return {
    shouldRender,
    animationState,
    animationClass: animationState
  };
}
