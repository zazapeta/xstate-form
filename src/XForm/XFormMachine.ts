import { setup, assign } from 'xstate';

const XInitialValues = Symbol('XFORM.initialValues');

type XFields = Record<string, any>;

interface FieldState {
  value: any;
  touched: boolean;
  error?: string;
  valid: boolean;
}

interface XFormContext<XFields> {
  initialValues: XFields | Symbol;
  fields: Record<string, FieldState>;
}

type XFormEvent =
  | { type: 'NEW_FIELD.REGISTER'; name: string; value: any }
  | { type: 'FIELD.UNREGISTER'; name: string }
  | { type: 'FIELD.FOCUS'; name: string }
  | { type: 'FIELD.CHANGE'; name: string; value: any }
  | { type: 'FIELD.BLUR'; name: string }
  | { type: 'FIELD.VALIDATE'; name: string }
  | { type: 'FIELD.RESET'; name: string }
  | { type: 'FORM.RESET' }
  | { type: 'FORM.SUBMIT' }
  | { type: 'FORM.VALIDATE' };

const createXFormMachine = ({
  id,
  initialValues,
  onSubmit,
  onValidate,
  onSubmitSuccess,
  onSubmitError,
}: any) =>
  setup({
    types: {
      context: {} as XFormContext<XFields>,
      events: {} as XFormEvent,
      input: {} as XFormContext<XFields>,
    },
  })
    .createMachine({
      id,
      context: {
        initialValues: XInitialValues,
        fields: {},
      },
      on: {
        "NEW_FIELD.REGISTER": {},
        "FIELD.*": {},
        "FORM.VALIDATE": {},
        "FORM.SUBMIT": {},
      },
      states: {
        editing: {},
        validating: {},
        submitting: {},
        success: {},
        error: {},
      },
    })
    .provide({
      // context: { initialValues, fields: [] },
      actors: {
        submit: onSubmit,
        validate: onValidate,
        submitSuccess: onSubmitSuccess,
        submitError: onSubmitError,
      },
    });

export default createXFormMachine;
