import { z } from "zod";
import React from 'react';
import { Config } from "../../core/types";
import { useStable } from "../../core/useStable"

type Reducer<S, A extends React.AnyActionArg> = (prevState: S, ...args: A) => S;

const createReducerFactory = <T, A extends React.AnyActionArg>(zodSchema:z.ZodType<T>, reducer: Reducer<T, A>, config?: Config): Reducer<T, A> => {
  return (prevState, ...args: A) => {
    const possibleNextState = reducer(prevState, ...args);

    const result = zodSchema.safeParse(possibleNextState);

    if (!result.success) {
      if (typeof config?.onError === 'function') {
        config?.onError(result?.error, prevState, possibleNextState);
      }
      
      const isStrict = config?.strict ?? false;
      return isStrict ? prevState : possibleNextState;
    }
    
    return possibleNextState;  
  };
};

export const useZodReducer = <T, A extends React.AnyActionArg>(schema:z.ZodType<T>, reducer: Reducer<T, A>, initialState: z.infer<typeof schema>, config?: Config) => {
  type S = z.infer<typeof schema>
  
  const [value, setValue] = React.useState<S>(() => initialState);
  const [schemaStable, configStable] = useStable<S>(schema, config);
  const reducerStable = React.useRef(reducer);
  
  type D = React.ActionDispatch<A>;

  const dispatch = React.useCallback<D>((...arg) => {
    const factory = createReducerFactory<
      S, A>(schemaStable.current, reducerStable.current, configStable.current);
    
    setValue(oldValue => factory(oldValue, ...arg))
  }, []);

  return [value, dispatch] as unknown as [S, D];
};