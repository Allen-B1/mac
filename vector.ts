export abstract class VecInterface {
    abstract euclidean(): number[];
}

export type Vec = number[] | VecInterface;

export const Vec = {
    euclidean: function(v: Vec) : number[] {
        if (v instanceof VecInterface) {
            return v.euclidean();
        } else {
            return v;
        }
    },
    add: function(v1: Vec, v2: Vec): number[] {
        let v1_ = Vec.euclidean(v1);
        let v2_ = Vec.euclidean(v2);
        if (v1_.length != v2_.length) { 
            throw new Error("Cannot add vectors of different dimension (" + v1_.length + " and " + v2_.length + ")");
        }
        return v1_.map((val, i) => val + v2_[i]);
    },
    mul: function(a: number, v: Vec): number[] {
        return Vec.euclidean(v).map(x => x * a);
    },
    dot: function(v1: Vec, v2: Vec): number {
        let v2_ = Vec.euclidean(v2);
        return Vec.euclidean(v1).reduce((sum, val, idx) => sum + val*v2_[idx], 0);
    },
    unit: function(v: Vec): number[] {
        let v_ = Vec.euclidean(v);
        let size = Math.sqrt(v_.reduce((sum, val) => sum + val*val, 0));
        return v_.map(x => x / size);
    }
};