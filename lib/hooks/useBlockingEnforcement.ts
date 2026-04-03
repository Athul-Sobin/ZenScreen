import { useRouter } from 'expo-router';
import { useWellbeing } from '../wellbeing-context';

/**
 * Hook to enforce app blocking with automatic navigation to blocked screen.
 * Call this after updating app usage to check if the app should now be blocked.
 * 
 * When an app is blocked, automatically navigates to /blocked with app context.
 * The blocked screen displays the reason and offers puzzle solving for extension.
 * 
 * Usage Example:
 * ```tsx
 * import { useBlockingEnforcement } from '@/lib/hooks/useBlockingEnforcement';
 * import { useWellbeing } from '@/lib/wellbeing-context';
 * 
 * export function MyComponent() {
 *   const enforceBlocking = useBlockingEnforcement();
 *   const { updateApp } = useWellbeing();
 *   
 *   const handleAppOpen = async (appId: string) => {
 *     // Update app usage
 *     await updateApp(appId, { usageMinutes: currentUsage + 5 });
 *     
 *     // Check if app is now blocked and navigate if needed
 *     const isBlocked = await enforceBlocking(appId);
 *     if (!isBlocked) {
 *       // App is not blocked, proceed normally
 *       navigateToApp(appId);
 *     }
 *   };
 *   
 *   return <Button onPress={() => handleAppOpen('spotify')} />;
 * }
 * ```
 * 
 * Returns:
 * - true if app is blocked (navigation already happened)
 * - false if app is not blocked (safe to proceed)
 */
export function useBlockingEnforcement() {
  const router = useRouter();
  const { checkBlockingEnforcement } = useWellbeing();

  const enforceBlocking = async (appId: string): Promise<boolean> => {
    const { isBlocked, reason } = checkBlockingEnforcement(appId);
    
    if (isBlocked) {
      // Navigate to blocked screen with app context
      router.replace({
        pathname: '/blocked',
        params: {
          appId,
          reason,
        },
      });
      return true;
    }
    
    return false;
  };

  return enforceBlocking;
}
