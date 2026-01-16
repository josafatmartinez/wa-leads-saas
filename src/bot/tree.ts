export type TreeNode =
  | {
      type: 'list';
      text: string;
      saveAs?: string;
      options: { id: string; title: string; next: string }[];
      buttonLabel?: string;
      sectionTitle?: string;
    }
  | {
      type: 'buttons';
      text: string;
      saveAs?: string;
      options: { id: string; title: string; next: string }[];
    }
  | {
      type: 'text';
      text: string;
      saveAs: string;
      next: string;
    }
  | {
      type: 'end';
      text: string;
    };

export const tree: Record<string, TreeNode> = {
  start: {
    type: 'buttons',
    text: 'Hola! Soy el asistente virtual. Como podemos ayudarte hoy?',
    saveAs: 'intent',
    options: [
      { id: 'demo', title: 'Quiero una demo', next: 'name' },
      { id: 'support', title: 'Soporte', next: 'issue' },
    ],
  },
  name: {
    type: 'text',
    text: 'Cual es tu nombre?',
    saveAs: 'name',
    next: 'email',
  },
  email: {
    type: 'text',
    text: 'Perfecto. Cual es tu correo electronico?',
    saveAs: 'email',
    next: 'end',
  },
  issue: {
    type: 'list',
    text: 'Elige el tipo de soporte que necesitas:',
    saveAs: 'supportType',
    buttonLabel: 'Ver opciones',
    sectionTitle: 'Soporte',
    options: [
      { id: 'billing', title: 'Facturacion', next: 'details' },
      { id: 'tech', title: 'Problema tecnico', next: 'details' },
    ],
  },
  details: {
    type: 'text',
    text: 'Cuentame mas detalles para poder ayudarte.',
    saveAs: 'details',
    next: 'end',
  },
  end: {
    type: 'end',
    text: 'Gracias. Un miembro de nuestro equipo te contactara pronto.',
  },
};
