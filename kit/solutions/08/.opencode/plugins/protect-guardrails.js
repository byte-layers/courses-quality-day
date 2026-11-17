// Refuse toute modification des garde-fous par l'agent : les tests et la configuration des outils.
// Un humain peut toujours les changer, dans un commit relu à part.
const GUARDED = [/(^|\/)test\//, /(^|\/)e2e\//, /(^|\/)\.gitea\//, /(^|\/)eslint\.config\.js$/, /(^|\/)sonar-project\.properties$/, /(^|\/)playwright\.config\.js$/];
const WRITERS = ['edit', 'write', 'patch'];

export const ProtectGuardrails = async () => ({
  'tool.execute.before': async (input, output) => {
    if (!WRITERS.includes(input.tool)) return;
    const path = String(output.args.filePath ?? '');
    if (GUARDED.some((pattern) => pattern.test(path))) {
      throw new Error(`Bloqué par le hook : ${path} est un garde-fou. Corrigez le code, ou demandez à un humain.`);
    }
  },
});
