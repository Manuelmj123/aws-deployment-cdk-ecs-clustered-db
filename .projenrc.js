const { NextJsProject } = require('projen');

const project = new NextJsProject({
  defaultReleaseBranch: 'main',
  name: 'manueldeploymentproject',

  deps: [
    '@prisma/client',
    'bcryptjs',
    'next-auth',
    'js-cookie',
    'framer-motion',
    'sonner',
  ],
  devDeps: ['prisma'],

  typescript: false,
});

// Keep your existing Docker files in source control
project.gitignore.removePatterns('Dockerfile');
project.gitignore.removePatterns('docker-compose.yml');

// Add a helper task to build with Docker
project.addTask('docker-build', {
  exec: 'docker compose build',
});

project.addTask('docker-up', {
  exec: 'docker compose up',
});

project.synth();
