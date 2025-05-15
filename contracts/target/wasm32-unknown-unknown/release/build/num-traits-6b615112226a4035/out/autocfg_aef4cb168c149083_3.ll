; ModuleID = 'autocfg_aef4cb168c149083_3.412d2bf960be70cb-cgu.0'
source_filename = "autocfg_aef4cb168c149083_3.412d2bf960be70cb-cgu.0"
target datalayout = "e-m:e-p:32:32-p10:8:8-p20:8:8-i64:64-n32:64-S128-ni:1:10:20"
target triple = "wasm32-unknown-unknown"

; autocfg_aef4cb168c149083_3::probe
; Function Attrs: nounwind
define dso_local void @_ZN26autocfg_aef4cb168c149083_35probe17h0e4553c7c5633849E() unnamed_addr #0 {
start:
  %0 = alloca [4 x i8], align 4
  store i32 1, ptr %0, align 4
  %_0.i = load i32, ptr %0, align 4
  ret void
}

; Function Attrs: nocallback nofree nosync nounwind speculatable willreturn memory(none)
declare i32 @llvm.cttz.i32(i32, i1 immarg) #1

attributes #0 = { nounwind "target-cpu"="generic" }
attributes #1 = { nocallback nofree nosync nounwind speculatable willreturn memory(none) }

!llvm.ident = !{!0}

!0 = !{!"rustc version 1.84.1 (e71f9a9a9 2025-01-27)"}
