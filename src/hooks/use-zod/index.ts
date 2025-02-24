import { z } from "zod";
import React from 'react';
import { Config } from "../../core/types";
import { useStable } from "../../core/useStable"


const createFactory = <T>(zodSchema:z.ZodType<T>, action: React.SetStateAction<T>, config?: Config): React.SetStateAction<T> => {
  return (prevState) => {
    const possibleNextState = action instanceof Function ? action(prevState) : action;

    const result = zodSchema.safeParse(possibleNextState);

    if (!result.success) {
      if (typeof config?.onError === 'function') {
        config?.onError(result?.error, prevState, possibleNextState);
      }
      
      const isStrict = config?.strict ?? false;
      return isStrict ? prevState : possibleNextState;
    }
    
    return result?.data || possibleNextState;  
  };
};

type UseZodReturn<T> = [T, React.Dispatch<React.SetStateAction<T>>];

export const useZod = <T>(schema: z.ZodType<T>, initialState: z.infer<typeof schema>, config?: Config) => {
  type S = z.infer<typeof schema>;
  type D = React.Dispatch<React.SetStateAction<S>>;
  const [value, setValue] = React.useState<z.infer<typeof schema>>(() => initialState);
  const [schemaStable, configStable] = useStable<S>(schema, config);
  

  const setter = React.useCallback<D>((arg) => {
    const factory = createFactory<
      S
    >(schemaStable.current, arg, configStable.current);
    
    setValue(factory)
  }, []);

  return [value, setter] as unknown as UseZodReturn<S>;
};