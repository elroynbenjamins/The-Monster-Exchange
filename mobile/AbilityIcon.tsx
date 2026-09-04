import React from 'react';
import {Image,View} from 'react-native';
import {abilityCell} from '../src/ui/ability-visuals.ts';
const atlas=require('../assets/pixel/abilities/ability-atlas-v1.png');
export function AbilityIcon({id,size=40}:{id:string;size?:number}){
 const cell=abilityCell(id),row=Math.floor(cell/8),col=cell%8;
 // Measured row boundaries preserve the generated atlas without repainting it.
 const rows=[0,194,367,535,704,869,1037,1222];
 const scale=size/Math.max(156.75,rows[row+1]-rows[row]);
 return <View accessible={false} style={{width:size,height:size,overflow:'hidden'}}><Image source={atlas} fadeDuration={0} style={{position:'absolute',width:1254*scale,height:1254*scale,left:-col*156.75*scale,top:-rows[row]*scale}}/></View>;
}
