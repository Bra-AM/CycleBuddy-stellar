; ModuleID = 'autocfg_70bc8a1a08fba859_8.f72bab3dbc8d89f6-cgu.0'
source_filename = "autocfg_70bc8a1a08fba859_8.f72bab3dbc8d89f6-cgu.0"
target datalayout = "e-m:o-i64:64-i128:128-n32:64-S128-Fn32"
target triple = "arm64-apple-macosx11.0.0"

; core::f64::<impl f64>::to_ne_bytes
; Function Attrs: inlinehint uwtable
define internal i64 @"_ZN4core3f6421_$LT$impl$u20$f64$GT$11to_ne_bytes17ha00d94a5307e93f9E"(double %self) unnamed_addr #0 {
start:
  %_0 = alloca [8 x i8], align 1
  %self1 = bitcast double %self to i64
  store i64 %self1, ptr %_0, align 1
  %0 = load i64, ptr %_0, align 1
  ret i64 %0
}

; autocfg_70bc8a1a08fba859_8::probe
; Function Attrs: uwtable
define void @_ZN26autocfg_70bc8a1a08fba859_85probe17ha31eba8b479c103fE() unnamed_addr #1 {
start:
  %0 = alloca [8 x i8], align 8
  %_1 = alloca [8 x i8], align 1
; call core::f64::<impl f64>::to_ne_bytes
  %1 = call i64 @"_ZN4core3f6421_$LT$impl$u20$f64$GT$11to_ne_bytes17ha00d94a5307e93f9E"(double 3.140000e+00)
  store i64 %1, ptr %0, align 8
  call void @llvm.memcpy.p0.p0.i64(ptr align 1 %_1, ptr align 8 %0, i64 8, i1 false)
  ret void
}

; Function Attrs: nocallback nofree nounwind willreturn memory(argmem: readwrite)
declare void @llvm.memcpy.p0.p0.i64(ptr noalias nocapture writeonly, ptr noalias nocapture readonly, i64, i1 immarg) #2

attributes #0 = { inlinehint uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #1 = { uwtable "frame-pointer"="non-leaf" "probe-stack"="inline-asm" "target-cpu"="apple-m1" }
attributes #2 = { nocallback nofree nounwind willreturn memory(argmem: readwrite) }

!llvm.module.flags = !{!0}
!llvm.ident = !{!1}

!0 = !{i32 8, !"PIC Level", i32 2}
!1 = !{!"rustc version 1.84.1 (e71f9a9a9 2025-01-27)"}
