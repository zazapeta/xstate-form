import { assign, fromPromise, setup, assertEvent, ErrorActorEvent } from "xstate";

interface FieldMachineErrorActorEvent extends ErrorActorEvent {
    type: 
        | "xstate.error.actor.onValidate";
    error: any;
}

type FieldMachineEvent<V> =
    | { type: 'FOCUS'; }
    | { type: 'CHANGE'; value: V }
    | { type: 'BLUR'; }
    | { type: 'VALIDATE'; }
    | { type: 'RESET'; }
    | { type: 'ENABLE'; }
    | { type: 'DISABLE'; }
    | FieldMachineErrorActorEvent



type FieldMachineContext<V> = {
    name: string,
    value: V,
    error: any,
    type?: string,
    meta?: Record<string, any>
    initialValue: V;
    isModified: boolean;
    isTouched: boolean;
    isVisited: boolean;
};
type FieldMachineOnValidInput<V> = {context: FieldMachineContext<V>, type: "change" | "blur"};
type FieldMachineAction<V> = {
    parse?: (value: any) => V,
    onValidate?: (input: FieldMachineOnValidInput<V>) => Promise<any | void>,
};

type ICreateFieldMachine<V> = FieldMachineAction<V> & FieldMachineContext<V>;

export function createFieldMachine<V>({ name, initialValue, type, meta, parse = (v) => v, onValidate = async () => {} }: ICreateFieldMachine<V>) {
    const initialContext = {
        name,
        initialValue,
        type,
        value: initialValue,
        meta,
        error: null,
        isModified: false,
        isVisited: false,
        isTouched: false,
    };
    const machine = setup({
        types: {
            context: {} as FieldMachineContext<V>,
            events: {} as FieldMachineEvent<V>,
        },
        actions: {
            modify: assign({
                isModified: true
            }),
            touch: assign({
                isTouched: true
            }),
            visit: assign({
                isVisited: true
            }),

            assignError: assign({
                error: ({ event }) => (assertEvent(event, "xstate.error.actor.onValidate"), parse(event.error))
            }),
            assignValue: assign({
                value: ({ event }) => (assertEvent(event, "CHANGE"), parse(event.value))
            }),
            reset: assign(initialContext),
        },
        actors: {
            onValidate: fromPromise<{}, FieldMachineOnValidInput>(({ input }) => onValidate(input)),
        },
        schemas: {
            events: {
                FOCUS: {
                    type: "object",
                    properties: {},
                },
                CHANGE: {
                    type: "object",
                    properties: {},
                },
                DISABLE: {
                    type: "object",
                    properties: {},
                },
                ENABLE: {
                    type: "object",
                    properties: {},
                },
                BLUR: {
                    type: "object",
                    properties: {},
                },
                RESET: {
                    type: "object",
                    properties: {},
                },
            },
            context: {} as FieldMachineContext<V>,
        },
    }).createMachine({
        context: initialContext,
        id: "FieldMachine",
        initial: "enabled",
        states: {
            enabled: {
                type: "parallel",
                on: {
                    DISABLE: {
                        target: "disabled",
                    },
                    RESET: {
                        target: "enabled",
                        actions: "reset"
                    },
                },
                states: {
                    focus: {
                        initial: "unfocused",
                        states: {
                            unfocused: {
                                on: {
                                    FOCUS: {
                                        target: "focused",
                                        actions: {
                                            type: "visit",
                                        },
                                    },
                                },
                            },
                            focused: {
                                on: {
                                    BLUR: {
                                        target: "unfocused",
                                        actions: {
                                            type: "touch",
                                        },
                                    },
                                },
                            },
                        },
                    },
                    validation: {
                        initial: "pending",
                        on: {
                            CHANGE: {
                                target: "#FieldMachine.enabled.validation.pending",
                                actions: [
                                    {
                                        type: "assignValue",
                                    },
                                    {
                                        type: "modify",
                                    },
                                ],
                            },
                            BLUR: {
                                target: "#FieldMachine.enabled.validation.pending",
                            },
                        },
                        states: {
                            pending: {
                                invoke: {
                                    id: "onValidate",
                                    input: ({ context }) => ({
                                        context,
                                        type: "change",
                                    }),
                                    onDone: {
                                        target: "valid",
                                    },
                                    onError: {
                                        target: "invalid",
                                        actions: {
                                            type: "assignError",
                                        },
                                    },
                                    src: "onValidate",
                                },
                            },
                            valid: {},
                            invalid: {},
                        },
                    },
                },
            },
            disabled: {
                on: {
                    ENABLE: {
                        target: "enabled",
                    },
                },
            },
        },
    });

    return machine;
}
