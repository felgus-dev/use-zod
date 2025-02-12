import { z, ZodError } from "zod";
import React, { useState, useCallback, useRef } from 'react';

type OnError = (error: ZodError) => void
type Config = {
  onError?: OnError;
};

const createFactory = <T>(zodSchema:z.ZodType<T>, action: React.SetStateAction<T>, onError?: OnError): React.SetStateAction<T> => {
  return (prevState) => {
    const possibleNewState = action instanceof Function ? action(prevState) : action;

    const result = zodSchema.safeParse(possibleNewState);

    if (!result.success) {
      if (typeof onError === 'function') {
        onError(result?.error);
      }
      
      return prevState;
    }
    
    return possibleNewState;  
  };
};

type UseZodReturn<T> = [T, React.Dispatch<React.SetStateAction<T>>];

export const useZod = <T>(schema: z.ZodType<T>, initialState: z.infer<typeof schema>, config?: Config) => {
  const [value, setValue] = useState<z.infer<typeof schema>>(() => initialState);
  const configStable = useRef(config);
  const schemaStable = useRef(schema);
  
  type S = z.infer<typeof schema>
  type D = React.Dispatch<React.SetStateAction<S>>;

  const setter = useCallback<D>((arg) => {
    const factory = createFactory<
      S
    >(schemaStable.current, arg, configStable.current?.onError);
    
    setValue(factory)
  }, []);

  return [value, setter] as unknown as UseZodReturn<S>;
};