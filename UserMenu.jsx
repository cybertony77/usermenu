import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState({ name: '', assistant_id: '', phone: '', role: '' });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
    if (token) {
      const decoded = decodeJWT(token);
      setUser({
        name: decoded?.name || '',
        assistant_id: decoded?.assistant_id || '',
        phone: decoded?.phone || '',
        role: decoded?.role || ''
      });
    }
  }, []);

  // PWA Install functionality
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Setting up PWA install functionality...');
      
      // Check if app is already installed
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
      
      console.log('Is app installed:', isInstalled);
      
      if (!isInstalled) {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
          console.log('🎉 beforeinstallprompt event fired!');
          console.log('Event details:', e);
          e.preventDefault();
          setDeferredPrompt(e);
          setShowInstallButton(true);
          console.log('✅ PWA install prompt available and stored');
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
          console.log('appinstalled event fired');
          setShowInstallButton(false);
          setDeferredPrompt(null);
          console.log('PWA installed');
        });

        // Check if service worker is registered (next-pwa handles this)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            console.log('Service worker registration:', registration);
            if (registration) {
              console.log('✅ Service worker registered by next-pwa');
            } else {
              console.log('⚠️ No service worker registration found');
            }
          }).catch((error) => {
            console.error('❌ Service worker registration error:', error);
          });
        } else {
          console.log('❌ Service worker not supported');
        }
        
        // Show install button if PWA criteria are met
        const checkPWACriteria = () => {
          const hasManifest = !!document.querySelector('link[rel="manifest"]');
          const hasServiceWorker = 'serviceWorker' in navigator;
          const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
          
          console.log('🔍 PWA Criteria Check:');
          console.log('- Has Manifest:', hasManifest);
          console.log('- Has Service Worker:', hasServiceWorker);
          console.log('- Is HTTPS/Localhost:', isHTTPS);
          
          // Always show install button for now, let the browser decide if it can install
          console.log('✅ Showing install button - browser will determine installability');
          setShowInstallButton(true);
        };
        
        // Check immediately and after a delay
        checkPWACriteria();
        setTimeout(checkPWACriteria, 2000);
        
        // Try to trigger beforeinstallprompt by simulating user interaction
        const triggerInstallPrompt = () => {
          console.log('Attempting to trigger install prompt...');
          
          // For mobile, try different approaches
          if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            console.log('📱 Mobile device detected, trying mobile-specific triggers...');
            
            // Try to trigger the install prompt by simulating user interaction
            const touchEvent = new TouchEvent('touchstart', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            document.dispatchEvent(touchEvent);
            
            // Also try a click event
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            document.dispatchEvent(clickEvent);
          }
        };
        
        // Try triggering after user has interacted with the page
        setTimeout(triggerInstallPrompt, 3000);
        
        // Also try when user actually clicks something
        document.addEventListener('click', () => {
          setTimeout(triggerInstallPrompt, 1000);
        }, { once: true });
        
        // Debug PWA criteria
        console.log('🔍 PWA Debug Info:');
        console.log('- HTTPS:', window.location.protocol === 'https:');
        console.log('- Service Worker:', 'serviceWorker' in navigator);
        console.log('- Manifest:', !!document.querySelector('link[rel="manifest"]'));
        console.log('- Display Mode:', window.matchMedia('(display-mode: standalone)').matches);
        console.log('- Navigator Standalone:', window.navigator.standalone);
        
        // Check manifest details
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
          fetch(manifestLink.href)
            .then(response => response.json())
            .then(manifest => {
              console.log('📋 Manifest Details:', manifest);
              console.log('- Icons count:', manifest.icons?.length || 0);
              console.log('- Screenshots count:', manifest.screenshots?.length || 0);
            })
            .catch(error => console.error('❌ Manifest fetch error:', error));
        }
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    router.push('/');
  };

  const handleManageAssistants = () => {
    router.push('/manage_assistants');
  };

  const handleEditProfile = () => {
    router.push('/manage_assistants/edit_my_profile');
  };

  const handleContactDeveloper = () => {
    router.push('/contact_developer');
  };

  const showManualInstallInstructions = () => {
    // Show manual installation instructions
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let message = '';
    let detailedSteps = '';
    
    if (isMobile) {
      if (isIOS) {
        message = '📱 iOS Safari Installation:';
        detailedSteps = '1. Tap the Share button (📤) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm\n\n💡 If you don\'t see the Share button, try scrolling down or tapping the address bar first.';
      } else if (isAndroid) {
        message = '📱 Android Chrome Installation:';
        detailedSteps = '1. Tap the menu (⋮) in the top right corner\n2. Tap "Add to Home Screen" or "Install app"\n3. Tap "Add" or "Install" to confirm\n\n💡 If you don\'t see the option, try refreshing the page first.';
      } else {
        message = '📱 Mobile Browser Installation:';
        detailedSteps = '1. Look for a menu button (⋮) or settings\n2. Find "Add to Home Screen" or "Install"\n3. Follow the prompts to install\n\n💡 Different mobile browsers have different installation methods.';
      }
    } else if (isChrome || isEdge) {
      message = '💻 Desktop Chrome/Edge Installation:';
      detailedSteps = '1. Look for the install icon (📱) in the address bar\n2. OR press F12 → Application tab → Manifest → Install\n3. OR click the puzzle piece icon → "Install TopPhysics"';
    } else {
      message = '🌐 Other Browser Installation:';
      detailedSteps = '1. Look for an install option in your browser menu\n2. OR try refreshing the page and clicking Install again';
    }
    
    const fullMessage = `${message}\n\n${detailedSteps}\n\n💡 Tip: Try refreshing the page and waiting a few seconds before clicking Install again.`;
    
    alert(fullMessage);
  };

  const handleInstallApp = async () => {
    console.log('Install button clicked');
    console.log('deferredPrompt:', deferredPrompt);
    
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        console.log('Prompting for installation...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('Installation outcome:', outcome);
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallButton(false);
        }
      } catch (error) {
        console.error('Installation error:', error);
        // Fall back to manual instructions if automatic install fails
        showManualInstallInstructions();
      }
    } else {
      console.log('No deferred prompt available or invalid prompt object');
      showManualInstallInstructions();
    }
  };

  return (
    <div style={{ position: 'relative', marginRight: 32 }} ref={menuRef}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: '#e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: open ? '0 2px 8px rgba(31,168,220,0.15)' : 'none',
          border: open ? '2px solid #1FA8DC' : '2px solid #e9ecef',
          transition: 'box-shadow 0.2s, border 0.2s'
        }}
        onClick={() => setOpen((v) => !v)}
        title={user.name || user.assistant_id}
      >
        {/* Use user image if available, else fallback to initial */}
        <span style={{ 
          fontWeight: 700, 
          fontSize: 22, 
          color: '#1FA8DC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          lineHeight: 1,
          textAlign: 'center'
        }}>
          {user.name ? user.name[0].toUpperCase() : (user.assistant_id ? user.assistant_id[0].toUpperCase() : 'U')}
        </span>
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: 54,
          right: 0,
          minWidth: 270,
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(31,168,220,0.18)',
          border: '1.5px solid #e9ecef',
          zIndex: 100,
          padding: '0 0 8px 0',
        }}>
          <div style={{
            padding: '18px 20px 12px 20px',
            borderBottom: '1px solid #e9ecef',
            textAlign: 'left',
            marginBottom: 8
          }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1FA8DC', marginBottom: 2 }}>{user.name || user.assistant_id}</div>
            <div style={{ color: '#495057', fontSize: 15, fontWeight: 600 }}>
              {user.assistant_id ? `ID: ${user.assistant_id}` : 'No ID'}
            </div>
          </div>
          <button style={menuBtnStyle} onClick={handleLogout}>Logout</button>
          {user.role === 'admin' && (
            <button style={menuBtnStyle} onClick={handleManageAssistants}>Manage Assistants</button>
          )}
          <button style={menuBtnStyle} onClick={handleEditProfile}>Edit My Profile</button>
          <button style={menuBtnStyle} onClick={handleContactDeveloper}>Contact Developer</button>
          {showInstallButton && (
            <button style={menuBtnStyle} onClick={handleInstallApp}>
              {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) 
                ? '📱 Install App'   // Mobile label
                : '💻 Install App'}  // Desktop label
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const menuBtnStyle = {
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#1FA8DC',
  fontWeight: 700,
  fontSize: 16,
  padding: '10px 20px',
  textAlign: 'left',
  cursor: 'pointer',
  borderRadius: 8,
  transition: 'background 0.15s',
  marginBottom: 2,
  outline: 'none',
}; 