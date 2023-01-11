import React from 'react';
import Urbit from '@urbit/http-api';

const api = new Urbit('', '', window.desk);
api.ship = window.ship;

export function App() {
  api.poke({
      app: 'tome-api',
      mark: 'tome-action',
      json: {
          'init-tome': {
            space: 'our',
            app: 'all',
            perm: {read: 'our', create: 'our', overwrite: 'our'}
          },
      },
      onError: (error) => {
          console.error(error)
      },
  })

  return (
    <main className="flex items-center justify-center min-h-screen">
    </main>
  );
}
