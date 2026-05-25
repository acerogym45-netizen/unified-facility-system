#!/bin/bash

# members.js 수정
sed -i 's/facility_id: FACILITY_IDS\.FITNESS/facility_id: this.currentFacilityId || FACILITY_IDS.FITNESS/g' members.js

# purchases.js 수정  
sed -i 's/facility_id: FACILITY_IDS\.APARTMENT/facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT/g' purchases.js

# additional-modules.js 수정
sed -i 's/facility_id: FACILITY_IDS\.APARTMENT/facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT/g' additional-modules.js
sed -i 's/facility_id: FACILITY_IDS\.FITNESS/facility_id: this.currentFacilityId || FACILITY_IDS.FITNESS/g' additional-modules.js

# new-features.js 수정
sed -i 's/facility_id: FACILITY_IDS\.APARTMENT/facility_id: this.currentFacilityId || FACILITY_IDS.APARTMENT/g' new-features.js

echo "✅ 모든 파일의 facility_id 수정 완료"
