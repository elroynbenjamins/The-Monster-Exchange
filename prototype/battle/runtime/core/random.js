                               
                  
                                        
                                   
 

export class SeededRandom                         {
          state        ;

  constructor(seed        ) {
    this.state = seed >>> 0 || 1;
  }

  float()         {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x1_0000_0000;
  }

  int(min        , max        )         {
    if (max < min) throw new Error(`Invalid random range ${min}..${max}`);
    return min + Math.floor(this.float() * (max - min + 1));
  }

  pick   (values              )    {
    if (values.length === 0) throw new Error("Cannot pick from an empty list");
    return values[this.int(0, values.length - 1)] ;
  }
}
