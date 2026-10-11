import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { StoreProvider, useStore } from '@/nk/store';
import { Shell } from '@/nk/Shell';
import Discover from '@/screens/Discover';
import OfferDetail from '@/screens/OfferDetail';
import Profile from '@/screens/Profile';
import CookApplication from '@/screens/CookApplication';
import MyCooking from '@/screens/MyCooking';
import OfferEditor from '@/screens/OfferEditor';
import Assistant from '@/screens/Assistant';
import OperatorReview from '@/screens/OperatorReview';
import ReportQueue from '@/screens/ReportQueue';

function Screens() {
  const { nav } = useStore();
  const s = nav.screen;
  return (
    <Shell>
      {s === 'Discover' && <Discover />}
      {s === 'Offer detail' && <OfferDetail />}
      {s === 'Profile' && <Profile key={nav.cookId ?? 'me'} />}
      {s === 'Cook application' && <CookApplication />}
      {s === 'My cooking' && <MyCooking />}
      {s === 'Offer editor' && <OfferEditor key={nav.editorKey} />}
      {s === 'Assistant' && <Assistant key={nav.editorKey} />}
      {s === 'Operator review' && <OperatorReview />}
      {s === 'Report queue' && <ReportQueue />}
    </Shell>
  );
}

function Home() {
  return (
    <StoreProvider>
      <Screens />
    </StoreProvider>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Router />
    </WouterRouter>
  );
}

export default App;
