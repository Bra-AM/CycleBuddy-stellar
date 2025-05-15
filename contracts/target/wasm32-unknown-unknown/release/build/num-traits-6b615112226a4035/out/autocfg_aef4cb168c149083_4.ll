; ModuleID = 'autocfg_aef4cb168c149083_4.274f6c97d098ed1c-cgu.0'
source_filename = "autocfg_aef4cb168c149083_4.274f6c97d098ed1c-cgu.0"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-unknown"

@alloc_e6758488a51c40069ade2309416f0500 = private unnamed_addr constant <{ [6 x i8] }> <{ [6 x i8] c"<anon>" }>, align 1
@alloc_5760cc517ece796840acf2ae2b53a0b1 = private unnamed_addr constant <{ ptr, [12 x i8] }> <{ ptr @alloc_e6758488a51c40069ade2309416f0500, [12 x i8] c"\06\00\00\00\01\00\00\00\1F\00\00\00" }>, align 4

; autocfg_aef4cb168c149083_4::probe
; Function Attrs: nounwind
define dso_local void @_ZN26autocfg_aef4cb168c149083_45probe17h4c1542e049da0ff9E() unnamed_addr #0 {
start:
  ret void
}

; core::panicking::panic_const::panic_const_div_by_zero
; Function Attrs: cold noinline noreturn nounwind
declare dso_local void @_ZN4core9panicking11panic_const23panic_const_div_by_zero17h96000c50d6e34eb3E(ptr align 4) unnamed_addr #1

attributes #0 = { nounwind "target-cpu"="generic" }
attributes #1 = { cold noinline noreturn nounwind "target-cpu"="generic" }

!llvm.ident = !{!0}

!0 = !{!"rustc version 1.84.1 (e71f9a9a9 2025-01-27)"}
