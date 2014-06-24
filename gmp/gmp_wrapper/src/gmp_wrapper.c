#include <stdlib.h>
#include <string.h>
#include "gmp.h"

#define MAX_MPZ_VARS 100

mpz_t *p_mpz_vars[MAX_MPZ_VARS];

int find_available(void *vars[], int max_vars) {
    for (int i = 0; i < max_vars; i++) {
        if (vars[i] == 0) return i;
    }
    return -1;
}

extern void init_mpz_vars() {
    memset(p_mpz_vars, 0, MAX_MPZ_VARS); 
}

extern int new_mpz_var() {
    int idx = find_available((void*)p_mpz_vars, MAX_MPZ_VARS);
    if (idx >= 0) {
        p_mpz_vars[idx] = malloc(sizeof(__mpz_struct));
        mpz_init(*p_mpz_vars[idx]);
    }
    return idx;
}

extern void del_mpz_var(int idx) {
    if (idx < MAX_MPZ_VARS) {
        mpz_clear(*p_mpz_vars[idx]);
        free(p_mpz_vars[idx]);
        p_mpz_vars[idx] = 0;
    }
}


/* 
wrapper fuggvenyek - ezek mintajara kell hozzaadni a tobbit is, 
amelyeket meg hasznalni akarsz 
*/
extern void w_mpz_set_str(int rop_idx, const char *str, int base) {
    mpz_set_str(*p_mpz_vars[rop_idx], str, base);
}

extern char* w_mpz_get_str(int base, int op_idx) {
    return mpz_get_str(0, base, *p_mpz_vars[op_idx]);
}

extern void w_mpz_add(int rop_idx, int op1_idx, int op2_idx) {
    mpz_add (*p_mpz_vars[rop_idx], *p_mpz_vars[op1_idx], *p_mpz_vars[op2_idx]);
}





