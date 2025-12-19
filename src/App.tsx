import { Toaster } from 'react-hot-toast';
import Hero from './components/Hero';
import ContractAddress from './components/ContractAddress';
import LiveStats from './components/LiveStats';
import Snowyify from './components/Snowyify';
import SocialLinks from './components/SocialLinks';
import SnowyRun from './components/SnowyRun';
import Leaderboard from './components/Leaderboard';
import AdventCalendar from './components/AdventCalendar';
import Giveaway from './components/Giveaway';
import GhostCursor from './components/GhostCursor';
import './App.css';

function App() {
  return (
    <div className="min-h-screen" style={{ position: 'relative' }}>
      <Toaster position="top-right" />
      
      {/* Ghost Cursor Effect */}
      <GhostCursor
        // Visuals
        color="#3b82f6"
        brightness={1.2}
        edgeIntensity={0}
        // Trail and motion
        trailLength={40}
        inertia={0.4}
        // Post-processing
        grainIntensity={0.05}
        bloomStrength={0.1}
        bloomRadius={1.0}
        bloomThreshold={0.025}
        // Fade-out behavior
        fadeDelayMs={800}
        fadeDurationMs={1200}
      />
      
      {/* Animated Snowflakes Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 20}s`,
              animationDelay: `${Math.random() * 5}s`,
              fontSize: `${0.5 + Math.random() * 1}em`,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      <div className="relative z-10">
        <Hero />
        <ContractAddress />
        <LiveStats />
        <SnowyRun />
        <Leaderboard />
        <Snowyify />
        <AdventCalendar />
        <Giveaway />
        <SocialLinks />
      </div>
    </div>
  );
}

export default App;
