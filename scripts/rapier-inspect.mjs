(async () => {
  try {
    const mod = await import('@dimforge/rapier3d-compat');
    console.log('module keys:', Object.keys(mod).slice(0, 40));
    console.log('module.default type:', typeof mod.default);
    if (typeof mod.default === 'function') {
      console.log('calling default() (no args)');
      const ret = await mod.default();
      console.log('default() returned length:', ret ? Object.keys(ret).length : 'falsey');
      console.log('ret keys', ret ? Object.keys(ret).slice(0, 40) : []);
    } else if (typeof mod.init === 'function') {
      console.log('calling init()');
      const ret = await mod.init();
      console.log('init() returned length:', ret ? Object.keys(ret).length : 'falsey');
      console.log('ret keys', ret ? Object.keys(ret).slice(0, 40) : []);
    }

    try {
      console.log('Attempting to construct IntegrationParameters...');
      const ip = new mod.IntegrationParameters();
      console.log('IntegrationParameters instance:', !!ip);
    } catch (e) {
      console.error('IntegrationParameters construction failed', e && e.message);
    }

    try {
      console.log('Attempting to create World...');
      const world = new mod.World({ x: 0, y: 0, z: 0 });
      console.log('World created:', !!world);
    } catch (e) {
      console.error('World creation failed', e && e.message);
    }
  } catch (err) {
    console.error('inspect failed', err);
  }
})();
