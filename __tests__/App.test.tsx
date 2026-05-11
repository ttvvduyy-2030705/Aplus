/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

function waitForAppEffects() {
  return new Promise<void>(resolve => setTimeout(resolve, 1500));
}

test('renders correctly', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
    await waitForAppEffects();
  });

  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });
});
