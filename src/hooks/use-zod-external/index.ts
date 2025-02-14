import { date, z } from "zod";
import React from 'react';
import { Config } from "../../core/types";
import { useStable } from "../../core/useStable";

export const useZodExternal = <T>(schema: z.ZodType<T>, externalFunc: () => z.infer<typeof schema> | Promise<z.infer<typeof schema>>, config?: Config) => {
  type S = z.infer<typeof schema>;

  const [isPending, setIsPending] = React.useState<boolean>(true);
  const [value, setValue] = React.useState<S | null>(null);
  const [error, setError] = React.useState(null);
  const [schemaStable, configStable] = useStable(schema, config);
  const externalFuncStable = React.useRef(externalFunc);

  React.useEffect(() => {
    externalFuncStable.current = externalFunc;
  }, [externalFunc]);

  const startExternal = React.useCallback(() => {
    setIsPending(true);
  }, []);

  const verifyDataWithSchema = React.useCallback((data: S, zodSchema: z.ZodType<S>, currentConfig?: Config) => {
    const result = zodSchema.safeParse(data);

    if (!result.success) {
      if (typeof currentConfig?.onError === 'function') {
        currentConfig?.onError(result?.error, value, data);
      }
      
      const isStrict = currentConfig?.strict ?? true;
      
      if (!isStrict) {
        setValue(result?.data || data);
      }
    }
    
    return result?.data;  
  }, []);


  React.useEffect(() => {
    if (isPending === true) {
      try {
        const resolver = externalFuncStable.current();
        if (resolver instanceof Promise){
          resolver.then(data => {
            verifyDataWithSchema(data, schemaStable.current, configStable.current);
            setIsPending(false);
          });
        }
      } catch(error) {
        setError(error);
        setIsPending(false);
      }
    }
  }, [isPending]);

  return [value, isPending, startExternal, error]
};