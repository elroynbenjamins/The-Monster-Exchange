# Habitat atlas v1

Generated with the built-in image-generation tool; central homebase-overview-v1.png is unchanged.

Final prompt specification: one 6-column by 9-row pixel-art habitat atlas, equal square cells. Type order normal/fire, water/grass, electric/ice, fighting/poison, ground/flying, psychic/bug, rock/ghost, dragon/dark, steel/fairy. Each type occupies three consecutive cells for small pen, developed nursery, ornate sanctuary. Distinct type terrain, identical camera/footprints, timber, stone and brass; no words or UI. Requested dark ground and safe cell padding. Output uses colored ground lighting around the buildings; rendered as opaque card windows, not transparent landscape overlays.

Runtime: EstateMap clips the original atlas into 54 tile windows without altering the source. Land expansion adds three plots per parcel, with up to three parcels per side. Central facility capacity is independent. Habitat build/upgrade cost scales by target level: 100 Crowns, 20 timber, 10 stone and one world day multiplied by level. Maximum level is three. Breeding-pair assignment and habitat gameplay bonuses are not yet connected.

Native phone touch/layout verification is still required. The estate is a horizontally paged grounds view, not a seamless stitched panorama.
