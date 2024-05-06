import { useMachine } from '@xstate/react';
import React, { useEffect } from 'react';
import createXFormMachine from './XFormMachine';

const XFormContext = React.createContext(null);
const XFormContextProvider = XFormContext.Provider;

function createFormMachine() {
  return {};
}

function XForm({ children, onSubmit, onValidate, initialValues }) {
  const form = useMachine(
    createXFormMachine.provide({
      actors: {
        validate: (context) => onValidate(context.values),
        submit: (context) => onSubmit(context.values),
      },
    }),
  );
  return (
    <XFormContextProvider value={form}>{children(form)}</XFormContextProvider>
  );
}

function useForm(componentName?: string) {
  const form = React.useContext(XFormContext);
  if (!form) {
    throw new Error(
      `${componentName || 'useForm'} must be used inside of a <Form> component`,
    );
  }
  return form;
}

function useField(name, initialValue) {
  const form = useForm();

  useEffect(() => {
    form.send({ type: 'REGISTER', name, initialValue });
    return () => {
      form.send({ type: 'UNREGISTER', name });
    };
  }, [form, name, initialValue]);

  const fieldActor = form.state.context.fields[name];

  return { fieldActor };
}

export default useForm;
